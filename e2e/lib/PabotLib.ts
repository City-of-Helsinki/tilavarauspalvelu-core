import { randomUUID } from "node:crypto";
/**
 * pabot's PabotLib keywords with the same names, for Playwright workers.
 *
 * Playwright workers are separate processes, like pabot's, so the shared state lives in files: a lock is a directory
 * created atomically with an owner file, and a parallel value is a JSON file. Each run has a folder of its own under
 * PABOT_SHARED_DIR, so a run never sees another run's state. Locks a test still holds are released when it ends.
 * pabot's value sets are not here: the testData fixture (TestSuites/fixtures.ts) picks each test's users.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { library, onTestEnd, pyRepr, sleepMs } from "./robot";
import type { RobotValue } from "./robot";

const E2E_ROOT = resolve(import.meta.dirname, "..");
/** The folder of the runs' shared state, one folder per run. */
export const SHARED_BASE = process.env.PABOT_SHARED_DIR ?? join(E2E_ROOT, ".pabot-shared");
const RUN_DIR = /^run-(\d+)-\d+$/;
/** Run folders older than this are removed at the start of a run. A newer one may belong to a run still going on. */
const OLD_RUN_MS = 24 * 60 * 60_000;
const OWNER_FILE = "owner.json";
/** A lock without an owner file this old was left by a worker that stopped right after creating it. */
const OWNERLESS_LOCK_MS = 10_000;

interface LockOwner {
  pid: number;
  token: string;
}

/** How many times this process holds each lock: like pabot's, a lock can be taken again by the process holding it. */
const heldLocks = new Map<string, number>();

const safeName = (name: string) => encodeURIComponent(name).replaceAll("%", "_");

/** This run's folder, made by the global setup. Outside a run (no global setup) the base folder is used. */
export function sharedDir(): string {
  return process.env.PABOT_SHARED_RUN_DIR ?? SHARED_BASE;
}

function lockDir(name: string): string {
  return join(sharedDir(), "locks", safeName(name));
}

function valueFile(key: string): string {
  return join(sharedDir(), "values", `${safeName(key)}.json`);
}

function hasCode(err: unknown, code: string): boolean {
  return err instanceof Error && "code" in err && err.code === code;
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: the process exists but belongs to another user
    return hasCode(err, "EPERM");
  }
}

/** Creates the lock with this process as its owner. False if the lock is taken. */
async function tryTake(dir: string): Promise<boolean> {
  await mkdir(dirname(dir), { recursive: true });
  try {
    await mkdir(dir);
  } catch (err) {
    if (hasCode(err, "EEXIST")) {
      return false;
    }
    throw err;
  }
  // Written to a temporary file and renamed, so the owner file is never read half-written
  const owner: LockOwner = { pid: process.pid, token: randomUUID() };
  try {
    await writeFile(join(dir, `${OWNER_FILE}.tmp`), JSON.stringify(owner));
    await rename(join(dir, `${OWNER_FILE}.tmp`), join(dir, OWNER_FILE));
  } catch (err) {
    // Another worker took the lock over before its owner file was written
    if (hasCode(err, "ENOENT")) {
      return false;
    }
    throw err;
  }
  return true;
}

/** The lock's owner, "ownerless" for a lock without an owner file, or null if the lock is gone. */
async function readOwner(dir: string): Promise<LockOwner | "ownerless" | null> {
  try {
    return JSON.parse(await readFile(join(dir, OWNER_FILE), "utf8")) as LockOwner;
  } catch (err) {
    if (!hasCode(err, "ENOENT")) {
      throw err;
    }
  }
  return existsSync(dir) ? "ownerless" : null;
}

/** How long ago the lock was created or changed, 0 if it is gone. */
async function ageMs(dir: string): Promise<number> {
  try {
    return Date.now() - (await stat(dir)).mtimeMs;
  } catch (err) {
    if (hasCode(err, "ENOENT")) {
      return 0;
    }
    throw err;
  }
}

/**
 * If the lock was left by a worker that has stopped, returns its owner's token ("" for a lock without an owner
 * file). Null while its owner is alive, or once the lock is gone. A recent lock without an owner file is still
 * being created.
 */
async function abandonedBy(dir: string): Promise<string | null> {
  const owner = await readOwner(dir);
  if (owner == null) {
    return null;
  }
  if (owner === "ownerless") {
    return (await ageMs(dir)) > OWNERLESS_LOCK_MS ? "" : null;
  }
  return processAlive(owner.pid) ? null : owner.token;
}

/**
 * Removes a lock left by a stopped worker. It is moved aside first, so that when two workers take over the same
 * lock, only one of them removes it. If the lock moved aside turns out to have a new owner already, it is moved back.
 */
async function takeOver(dir: string, token: string): Promise<void> {
  const aside = `${dir}.${process.pid}.${randomUUID()}.stale`;
  try {
    await rename(dir, aside);
  } catch (err) {
    if (hasCode(err, "ENOENT")) {
      return;
    }
    throw err;
  }
  const owner = await readOwner(aside);
  if (owner === "ownerless" ? token === "" : owner?.token === token) {
    await rm(aside, { recursive: true, force: true });
  } else {
    await rename(aside, dir);
  }
}

/** Takes the lock, or the lock left by a stopped worker. False if a live worker holds it. */
async function tryTakeOrTakeOver(dir: string): Promise<boolean> {
  if (await tryTake(dir)) {
    return true;
  }
  const token = await abandonedBy(dir);
  if (token == null) {
    return false;
  }
  await takeOver(dir, token);
  return tryTake(dir);
}

/** Takes a lock, waiting until it is free. Taking a lock this process already holds just counts it again. */
async function acquire(name: string): Promise<void> {
  const held = heldLocks.get(name);
  if (held != null) {
    heldLocks.set(name, held + 1);
    return;
  }
  // oxlint-disable-next-line no-await-in-loop -- waiting for the lock
  while (!(await tryTakeOrTakeOver(lockDir(name)))) {
    // oxlint-disable-next-line no-await-in-loop -- polling interval
    await sleepMs(100);
  }
  heldLocks.set(name, 1);
}

/** Releases a lock once. It is freed when it has been released as many times as it was taken. */
async function release(name: string): Promise<void> {
  const held = heldLocks.get(name);
  if (held == null) {
    // How pabot's lock server fails: a KeyError for a lock nobody holds, an empty assert for another process's lock
    throw new Error(existsSync(lockDir(name)) ? "AssertionError" : `KeyError: ${pyRepr(name)}`);
  }
  if (held > 1) {
    heldLocks.set(name, held - 1);
    return;
  }
  heldLocks.delete(name);
  await rm(lockDir(name), { recursive: true, force: true });
}

onTestEnd(async () => {
  for (const name of heldLocks.keys()) {
    // oxlint-disable-next-line no-await-in-loop -- releasing one by one
    await rm(lockDir(name), { recursive: true, force: true });
  }
  heldLocks.clear();
});

export const PabotLib = library("PabotLib", {
  "Acquire Lock": async (name: RobotValue) => {
    await acquire(String(name));
    return true;
  },

  "Release Lock": async (name: RobotValue) => {
    await release(String(name));
  },

  "Set Parallel Value For Key": async (key: RobotValue, value: RobotValue) => {
    const file = valueFile(String(key));
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(value));
    await rename(temporary, file);
  },

  /** An empty string when the key has no value yet, like PabotLib. */
  "Get Parallel Value For Key": async (key: RobotValue) => {
    const file = valueFile(String(key));
    if (!existsSync(file)) {
      return "";
    }
    return JSON.parse(await readFile(file, "utf8"));
  },
});

/**
 * Makes this run's folder for the shared state, for the workers to find in PABOT_SHARED_RUN_DIR, and removes the
 * folders of old runs. Called from the global setup.
 */
export async function resetSharedState(): Promise<void> {
  await mkdir(SHARED_BASE, { recursive: true });
  for (const entry of await readdir(SHARED_BASE)) {
    const started = Number(RUN_DIR.exec(entry)?.[1] ?? 0);
    if (Date.now() - started > OLD_RUN_MS) {
      // oxlint-disable-next-line no-await-in-loop -- small directory
      await rm(join(SHARED_BASE, entry), { recursive: true, force: true });
    }
  }
  const runDir = join(SHARED_BASE, `run-${Date.now()}-${process.pid}`);
  await mkdir(runDir);
  process.env.PABOT_SHARED_RUN_DIR = runDir;
}
