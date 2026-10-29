/**
 * The suite's runtime: keyword steps, logging, secret redaction and the `test` fixtures.
 *
 * A page object method marked with `@step("module.Keyword Name")` is a keyword: each call is a `test.step` with that
 * title, so the Playwright report shows the tree of keywords a test ran.
 */
import { existsSync } from "node:fs";
import { test as base, errors } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import type { Locator, TestInfo } from "@playwright/test";

const SECRET_NAMES = ["WAF_BYPASS_SECRET", "ROBOT_API_TOKEN", "DJANGO_ADMIN_PASSWORD"];

/** Hides secrets from step titles and logs. */
export function redact(text: string): string {
  let result = text;
  for (const name of SECRET_NAMES) {
    const secret = process.env[name];
    if (secret != null && secret.length > 0) {
      // Also as it appears inside a printed object, where quotes and backslashes are escaped
      for (const form of new Set([secret, JSON.stringify(secret).slice(1, -1)])) {
        result = result.replaceAll(form, "***");
      }
    }
  }
  return result;
}

/** Hides secrets in a HAR file, like in the logs. */
export async function redactHarFile(path: string): Promise<void> {
  // A .zip HAR is an archive, not text; the suite writes .har files
  if (path.endsWith(".zip") || !existsSync(path)) {
    return;
  }
  const text = await readFile(path, "utf8");
  const hidden = redact(text);
  if (hidden !== text) {
    await writeFile(path, hidden);
  }
}

/** ENABLE_HAR_RECORDING=True records a HAR file of every browser context. */
export function harRecordingEnabled(): boolean {
  return process.env.ENABLE_HAR_RECORDING === "True";
}

/** A Playwright Locator, which prints as Playwright describes it: `getByTestId('reservation__status')` */
function isLocator(value: unknown): value is Locator {
  const candidate = value as { click?: unknown; locator?: unknown } | null;
  return (
    typeof candidate === "object" &&
    candidate != null &&
    typeof candidate.click === "function" &&
    typeof candidate.locator === "function"
  );
}

/** Formats a keyword argument or a log message for a step title: a locator as Playwright describes it, objects as JSON. */
export function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "function") {
    return value.name.length > 0 ? value.name : "function";
  }
  if (isLocator(value)) {
    return value.toString();
  }
  if (typeof value === "object" && value != null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function stepTitle(name: string, args: unknown[]): string {
  if (args.length === 0) {
    return name;
  }
  const shown = args.map((arg) => redact(formatValue(arg))).join("    ");
  const title = `${name}    ${shown}`;
  return title.length > 220 ? `${title.slice(0, 217)}...` : title;
}

/** Hides secrets in an error's message and stack, and in those of its causes, keeping the same error object. */
function redactError(err: unknown): void {
  const seen = new Set<unknown>();
  let current = err;
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    for (const key of ["message", "stack"] as const) {
      const text = current[key];
      if (typeof text === "string" && redact(text) !== text) {
        // Defined rather than assigned: some errors (DOMException) have a read-only message
        Reflect.defineProperty(current, key, { value: redact(text), writable: true, configurable: true });
      }
    }
    current = current.cause;
  }
}

/** Runs `body`, hiding secrets in the error it fails with. */
async function redactingErrors<T>(body: () => T | Promise<T>): Promise<T> {
  try {
    return await body();
  } catch (err) {
    redactError(err);
    throw err;
  }
}

/**
 * Runs `body` as a report step. Outside a test (e.g. while listing tests) it just runs the body.
 * Secrets are hidden in the error the step fails with, so they don't reach the report.
 */
export function runStep<T>(title: string, body: () => T | Promise<T>): Promise<T> {
  if (currentTestInfo == null) {
    return redactingErrors(body);
  }
  return base.step(title, () => redactingErrors(body));
}

/**
 * Makes a page object method a keyword: each call is a report step titled with the keyword's name and arguments,
 * e.g. `app_common.User Logs In With Suomi Fi`, so the report shows the tree of keywords a test ran. Secrets are
 * hidden in the title and in the error the step fails with.
 */
export function step(name: string) {
  return function decorate<This, Args extends unknown[], Return>(
    method: (this: This, ...args: Args) => Promise<Return>,
    _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ): (this: This, ...args: Args) => Promise<Return> {
    return function keyword(this: This, ...args: Args): Promise<Return> {
      return runStep(stepTitle(name, args), () => method.apply(this, args));
    };
  };
}

let currentTestInfo: TestInfo | null = null;

/**
 * Logs a message as a report step titled `Log    message`, with secrets hidden. A WARN or ERROR message is also an
 * annotation of the test, which the report shows at the top. DEBUG messages are left out.
 */
export async function log(
  message: unknown,
  options: { level?: "DEBUG" | "INFO" | "WARN" | "ERROR"; console?: boolean } = {}
): Promise<void> {
  const level = options.level ?? "INFO";
  if (level === "DEBUG") {
    return;
  }
  const text = redact(formatValue(message));
  if (level === "WARN" || level === "ERROR") {
    testInfo().annotations.push({ type: level === "WARN" ? "warning" : "error", description: text });
  }
  if (options.console === true) {
    process.stdout.write(`${text}\n`);
  }
  await runStep(`Log    ${text.length > 200 ? `${text.slice(0, 197)}...` : text}`, () => undefined);
}

function testInfo(): TestInfo {
  if (currentTestInfo == null) {
    throw new Error("No running test");
  }
  return currentTestInfo;
}

/** Sequential mode: FORCE_SINGLE_USER=True or a single worker, where all tests share the same users. */
export function isSequential(): boolean {
  const force = process.env.FORCE_SINGLE_USER;
  if (force != null && force.toLowerCase() === "true") {
    return true;
  }
  return currentTestInfo != null && currentTestInfo.config.workers === 1;
}

type TestEndHook = (info: TestInfo) => Promise<void>;
const testEndHooks: TestEndHook[] = [];

/** Lets the runtime clean up (release locks) after each test. */
export function onTestEnd(hook: TestEndHook): void {
  testEndHooks.push(hook);
}

/** The Playwright `test` of tests that open no pages (create_data, selftest). Keeps the running test's info. */
export const testWithoutBrowser = base.extend<{ testRuntime: undefined }>({
  testRuntime: [
    async ({ playwright: _playwright }, use, info) => {
      currentTestInfo = info;
      await use(undefined);
      for (const hook of testEndHooks) {
        // oxlint-disable-next-line no-await-in-loop -- hooks must run one after another
        await redactingErrors(() => hook(info));
      }
      currentTestInfo = null;
    },
    { auto: true },
  ],
});

/**
 * The Playwright `test` of the suites: tests that open pages. With ENABLE_HAR_RECORDING=True, the test's context
 * records a HAR file into the test's results folder.
 */
export const test = testWithoutBrowser.extend({
  contextOptions: [
    async ({ contextOptions }, use, info) => {
      const path = harRecordingEnabled() ? info.outputPath("context.har") : null;
      await use(path == null ? contextOptions : { ...contextOptions, recordHar: { path, content: "embed" } });
      // The context has closed by now, so the file is complete
      if (path != null) {
        await redactHarFile(path);
      }
    },
    { scope: "test" },
  ],
});

export { expect } from "@playwright/test";

/** An error's message, with the error name for Playwright's timeouts: "TimeoutError: locator.waitFor: ..." */
export function errorMessage(err: unknown): string {
  if (err instanceof errors.TimeoutError) {
    return `${err.name}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/** Lets a skip through a catch: test.skip() throws, and a skipped test must stay skipped. */
export function rethrowSkip(err: unknown): void {
  // test.skip() marks the test as expected to be skipped and then throws
  if (currentTestInfo != null && currentTestInfo.expectedStatus === "skipped" && err != null) {
    throw err;
  }
}
