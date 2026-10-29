/**
 * Runtime for the Robot Framework port.
 *
 * Every Robot keyword keeps its exact name as a string key, e.g. `app_common["User Logs In With Suomi Fi"]()`.
 * `keywords()` wraps each one in a `test.step` titled `module.Keyword Name`, so the Playwright report shows the
 * same keyword tree as the Robot log. Robot variables keep their names as properties of `V`, typed by
 * `TestSuites/variable-types.ts`.
 */
import { existsSync } from "node:fs";
import { test as base, errors } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import type { BrowserContext, Page, Browser as PlaywrightBrowser, TestInfo } from "@playwright/test";

// Robot Framework values are dynamically typed, and a line-by-line port keeps that.
// oxlint-disable-next-line typescript/no-explicit-any
export type RobotValue = any;
export type KeywordImplementation = (...args: RobotValue[]) => unknown;
export type Keyword = (...args: RobotValue[]) => Promise<RobotValue>;

type Wrapped<T extends Record<string, KeywordImplementation>> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>;
};

/** Keywords by `module.Keyword Name`, used by `Run Keyword` and the naming parity check. */
export const KEYWORD_REGISTRY = new Map<
  string,
  { module: string; name: string; implementation: KeywordImplementation }
>();

const SECRET_NAMES = ["WAF_BYPASS_SECRET", "ROBOT_API_TOKEN", "DJANGO_ADMIN_PASSWORD"];

/** Hides secrets from step titles and logs. */
export function redact(text: string): string {
  let result = text;
  for (const name of SECRET_NAMES) {
    const secret = process.env[name];
    if (secret != null && secret.length > 0) {
      // Also as it appears inside a printed dictionary or list, where quotes and backslashes are escaped
      for (const form of new Set([secret, JSON.stringify(secret).slice(1, -1), pyString(secret).slice(1, -1)])) {
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

/** ENABLE_HAR_RECORDING=True records a HAR file of every browser context (har_recording.robot). */
export function harRecordingEnabled(): boolean {
  return process.env.ENABLE_HAR_RECORDING === "True";
}

export function isSecret(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    SECRET_NAMES.some((name) => process.env[name] != null && process.env[name] === value)
  );
}

/**
 * The selector of an element reference. The Browser library's references are selector strings like
 * `tbody >> a >> nth=0`; the port's are Playwright Locators, whose selector is the same string.
 */
function elementSelector(value: unknown): string | undefined {
  const candidate = value as { _selector?: unknown; click?: unknown } | null;
  if (typeof candidate === "object" && candidate != null && typeof candidate.click === "function") {
    return typeof candidate._selector === "string" ? candidate._selector : undefined;
  }
  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value == null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype == null;
}

function pyString(text: string): string {
  const quote = text.includes("'") && !text.includes('"') ? '"' : "'";
  const escaped = text.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll("\r", "\\r").replaceAll("\t", "\\t");
  return `${quote}${quote === "'" ? escaped.replaceAll("'", "\\'") : escaped}${quote}`;
}

/** A value as Python's repr() shows it, which is how Robot logs lists and dictionaries. */
export function pyRepr(value: unknown): string {
  if (value == null) {
    return "None";
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  if (typeof value === "string") {
    return pyString(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item: unknown) => pyRepr(item)).join(", ")}]`;
  }
  const selector = elementSelector(value);
  if (selector != null) {
    return pyString(selector);
  }
  if (isPlainObject(value)) {
    return `{${Object.entries(value)
      .map(([key, item]) => `${pyString(key)}: ${pyRepr(item)}`)
      .join(", ")}}`;
  }
  return String(value);
}

/** Formats a value the way the Robot log shows it, shortened for step titles. */
export function formatValue(value: unknown): string {
  if (value == null) {
    return "None";
  }
  if (typeof value === "string") {
    return value;
  }
  // Named arguments as Robot writes them: timeout=5s    message=...
  if (value instanceof Named) {
    return Object.entries(value.values)
      .map(([name, item]) => `${name}=${formatValue(item)}`)
      .join("    ");
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "function") {
    return value.name.length > 0 ? value.name : "function";
  }
  const selector = elementSelector(value);
  if (selector != null) {
    return selector;
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    return pyRepr(value);
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function stepTitle(name: string, args: RobotValue[]): string {
  if (logLevel() === "NONE" || args.length === 0) {
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
export function step<T>(title: string, body: () => T | Promise<T>): Promise<T> {
  if (currentTestInfo == null) {
    return redactingErrors(body);
  }
  return base.step(title, () => redactingErrors(body));
}

/** Defines the keywords of one Robot resource file. The keys are the Robot keyword names. */
export function keywords<T extends Record<string, KeywordImplementation>>(module: string, definitions: T): Wrapped<T> {
  const wrapped: Record<string, Keyword> = {};
  for (const [name, implementation] of Object.entries(definitions)) {
    const qualified = `${module}.${name}`;
    KEYWORD_REGISTRY.set(qualified, { module, name, implementation });
    wrapped[name] = (...args: RobotValue[]) => step(stepTitle(qualified, args), () => implementation(...args));
  }
  return wrapped as Wrapped<T>;
}

/** Library keywords (Browser, BuiltIn, ...) are wrapped the same way, titled e.g. `Browser.Click    id=login`. */
export const library = keywords;

/**
 * The Robot variables by name. `TestSuites/variable-types.ts` declares their names and types here (declaration
 * merging), so a misspelled variable fails the type check.
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- filled by declaration merging
export interface Variables {}

// Robot variables: defaults from the variable files, plus everything set at runtime with
// Set Test Variable / Set Suite Variable. Reset before every test.
const variables: Record<string, RobotValue> = {};
export const V = variables as Variables;

/** The variables by names known only at runtime, for the naming parity check. */
export const variablesByName: Readonly<Record<string, RobotValue>> = variables;
let defaults: Record<string, RobotValue> = {};

export function registerVariables(values: Record<string, RobotValue>): void {
  for (const [name, value] of Object.entries(values)) {
    // The first definition wins, like an import that is already loaded
    if (!(name in defaults)) {
      defaults[name] = value;
    }
  }
  resetVariables();
}

/** The variables docker-test.sh and the CI workflow set with `--variable`. */
const COMMAND_LINE_VARIABLES = ["ENABLE_HAR_RECORDING", "FORCE_SINGLE_USER"];

export function resetVariables(): void {
  for (const name of Object.keys(variables)) {
    Reflect.deleteProperty(variables, name);
  }
  Object.assign(variables, structuredClone(defaults));
  // Like `robot --variable NAME:value`, an environment variable overrides one of these. Only the variables the Robot
  // runners pass on the command line: an unrelated environment variable like BROWSER must not change the suite.
  for (const name of COMMAND_LINE_VARIABLES) {
    const override = process.env[name];
    if (override != null) {
      variables[name] = override;
    }
  }
}

export function clearVariableDefaults(): void {
  defaults = {};
}

// Robot's built-in variables for the running test
let currentTestInfo: TestInfo | null = null;
let currentSuiteName = "";
let currentLogLevel = "INFO";

export function logLevel(): string {
  return currentLogLevel;
}

export function setLogLevel(level: string): string {
  const previous = currentLogLevel;
  currentLogLevel = level.toUpperCase();
  return previous;
}

export function testInfo(): TestInfo {
  if (currentTestInfo == null) {
    throw new Error("No running test");
  }
  return currentTestInfo;
}

/** Robot compares and sorts tags case-insensitively, ignoring spaces and underscores. */
const normalizeTag = (tag: string) => tag.toLowerCase().replaceAll(/[\s_]/g, "");

export const robot = {
  get TEST_NAME(): string {
    return testInfo().title;
  },
  get SUITE_NAME(): string {
    return currentSuiteName;
  },
  /** Test tags without the "@" prefix that Playwright requires, unique and sorted like Robot's Tags. */
  get TEST_TAGS(): string[] {
    const tags = testInfo().tags.map((tag) => tag.replace(/^@/, ""));
    return tags
      .filter((tag, index) => tags.findIndex((other) => normalizeTag(other) === normalizeTag(tag)) === index)
      .toSorted((a, b) => (normalizeTag(a) < normalizeTag(b) ? -1 : normalizeTag(a) > normalizeTag(b) ? 1 : 0));
  },
  /** pabot's process pool id. None in sequential mode, like a plain `robot` run. */
  get PABOTEXECUTIONPOOLID(): string | null {
    if (isSequential()) {
      return null;
    }
    return String(testInfo().parallelIndex);
  },
  get TEST_STATUS(): string {
    const info = testInfo();
    return info.status === info.expectedStatus ? "PASS" : "FAIL";
  },
};

/** Sequential mode: FORCE_SINGLE_USER=True or a single worker, like running with `robot` instead of `pabot`. */
export function isSequential(): boolean {
  const force = process.env.FORCE_SINGLE_USER;
  if (force != null && force.toLowerCase() === "true") {
    return true;
  }
  return currentTestInfo != null && currentTestInfo.config.workers === 1;
}

type TestEndHook = (info: TestInfo) => Promise<void>;
const testEndHooks: TestEndHook[] = [];

/** Lets the shims clean up (close browsers, release locks) after each test. */
export function onTestEnd(hook: TestEndHook): void {
  testEndHooks.push(hook);
}

/** Playwright's browser, context and page of the running test. */
export interface TestFixtures {
  browser: PlaywrightBrowser;
  context: BrowserContext;
  page: Page;
}

let currentFixtures: TestFixtures | null = null;

/** The running test's browser, context and page, which `openTestPage` in Browser.ts starts from. */
export function testFixtures(): TestFixtures {
  if (currentFixtures == null) {
    throw new Error("This test has no page: tests that open pages use `test` from lib/robot");
  }
  return currentFixtures;
}

/** The Playwright `test` of tests that open no pages (create_data, selftest). Sets up Robot's per-test state. */
export const testWithoutBrowser = base.extend<{ robotTest: undefined }>({
  robotTest: [
    async ({ playwright: _playwright }, use, info) => {
      currentTestInfo = info;
      currentSuiteName = info.titlePath[1] ?? "";
      currentLogLevel = "INFO";
      resetVariables();
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
 * The Playwright `test` used by the ported suites. It also gives the Browser library keywords Playwright's browser,
 * context and page, which the project's `use` options in playwright.config.ts make, so traces, screenshots and video
 * work like in any Playwright test.
 */
export const test = testWithoutBrowser.extend<{ robotPage: undefined }>({
  // ENABLE_HAR_RECORDING=True: the test's context records a HAR file into the test's results folder
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
  robotPage: [
    async ({ browser, context, page }, use) => {
      currentFixtures = { browser, context, page };
      await use(undefined);
      currentFixtures = null;
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";

// The units of Robot's time strings (robot/utils/robottime.py) in milliseconds, with the unit letter and names
const UNIT_NAMES: Array<[number, string[]]> = [
  [1e-6, ["n", "nanosecond", "ns"]],
  [1e-3, ["u", "microsecond", "us", "μs"]],
  [1, ["millisecond", "millisec", "millis", "msec", "ms"]],
  [1000, ["s", "second", "sec"]],
  [60_000, ["m", "minute", "min"]],
  [3_600_000, ["h", "hour"]],
  [86_400_000, ["d", "day"]],
  [604_800_000, ["w", "week"]],
];
// Robot also accepts the plural of a name that doesn't end in "s" ("days", "secs", but not "ds")
const TIME_UNITS = new Map(
  UNIT_NAMES.flatMap(([ms, names]) =>
    names
      .flatMap((name) => (name.length > 1 && !name.endsWith("s") ? [name, `${name}s`] : [name]))
      .map((name): [string, number] => [name, ms])
  )
);

/**
 * Converts a Robot time to milliseconds like Robot's timestr_to_secs: a number of seconds ("40", "1.5"), a timer
 * ("01:30", "1:00:10.5") or a time string ("1.5s", "500 ms", "2 min", "1 day 2 hours", "-1d"). Each unit can be
 * given once, and a leading "-" negates the whole time.
 */
export function timeToMs(time: RobotValue): number {
  if (typeof time === "number") {
    return Math.round(time * 1000);
  }
  const invalid = () => new Error(`Invalid time string "${String(time)}"`);
  const timer = /^([+-])?(\d+:)?(\d+):(\d+)(\.\d+)?$/.exec(String(time));
  if (timer != null) {
    const [, sign, hours = "0:", minutes = "0", seconds = "0", fraction = ""] = timer;
    const total = Number.parseInt(hours, 10) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(`0${fraction}`);
    return Math.round((sign === "-" ? -total : total) * 1000);
  }
  const text = String(time).toLowerCase().replaceAll(/\s/g, "");
  if (/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) {
    return Math.round(Number.parseFloat(text) * 1000);
  }
  const negative = text.startsWith("-");
  const rest = negative ? text.slice(1) : text;
  const parts = [...rest.matchAll(/([+-]?(?:\d+(?:\.\d*)?|\.\d+))([a-zμ]+)/g)];
  if (rest === "" || parts.map((part) => part[0]).join("") !== rest) {
    throw invalid();
  }
  const seen = new Set<number>();
  let total = 0;
  for (const [, value = "", name = ""] of parts) {
    const unit = TIME_UNITS.get(name);
    if (unit == null || seen.has(unit)) {
      throw invalid();
    }
    seen.add(unit);
    total += Number.parseFloat(value) * unit;
  }
  // Robot rounds to milliseconds
  return Math.round(negative ? -total : total);
}

/** Robot's truthiness for values like "True", "false", "${TRUE}" and "". */
export function isTruthy(value: RobotValue): boolean {
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    return !["", "false", "none", "no", "off", "0"].includes(text);
  }
  return Boolean(value);
}

/** Python truthiness, for `$var` in an expression: "", 0, None and empty lists are false. */
export function pyBool(value: RobotValue): boolean {
  if (value == null) {
    return false;
  }
  if (Array.isArray(value) || typeof value === "string") {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return Boolean(value);
}

/** The message Robot gives to `EXCEPT    AS    ${error}`. */
export function errorMessage(err: unknown): string {
  // The Browser library reports Playwright's timeouts with the error name: "TimeoutError: locator.waitFor: ..."
  if (err instanceof errors.TimeoutError) {
    return `${err.name}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/** Robot's EXCEPT does not catch a skip. Playwright's test.skip() throws, so pass that through. */
export function rethrowSkip(err: unknown): void {
  if (isSkip(err)) {
    throw err;
  }
}

export function isSkip(err: unknown): boolean {
  // test.skip() marks the test as expected to be skipped and then throws
  return currentTestInfo != null && currentTestInfo.expectedStatus === "skipped" && err != null;
}

/** `EXCEPT    pattern    type=glob` matching against the error message. */
export function exceptionMatches(err: unknown, pattern: RobotValue, type: string): boolean {
  const message = errorMessage(err);
  if (type === "glob") {
    const source = String(pattern)
      .replaceAll(/[.+^${}()|[\]\\]/g, "\\$&")
      .replaceAll("*", ".*")
      .replaceAll("?", ".");
    return new RegExp(`^${source}$`, "s").test(message);
  }
  return message === String(pattern);
}

export async function sleepMs(ms: number): Promise<void> {
  const { setTimeout } = await import("node:timers/promises");
  await setTimeout(ms);
}

/** Robot's `${x}` in a string: None -> "None", True -> "True", lists like Python. */
export function str(value: RobotValue): string {
  if (value == null) {
    return "None";
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }
  if (Array.isArray(value)) {
    return pyRepr(value);
  }
  if (typeof value === "object") {
    // An element reference is its selector, like the Browser library's string references
    return elementSelector(value) ?? formatValue(value);
  }
  return String(value);
}

/** Robot's named arguments (`timeout=10s`) and `&{dict}` arguments of a library keyword call. */
export class Named {
  readonly values: Record<string, RobotValue>;

  constructor(values: Record<string, RobotValue>) {
    this.values = values;
  }
}

export function named(values: Record<string, RobotValue>): Named {
  return new Named(values);
}

/**
 * Resolves a library keyword's arguments from positional values and a trailing `named()`, like Robot does.
 * `parameters` lists the argument names in order; a name starting with `*` collects the rest (varargs).
 */
export function argsOf(
  args: RobotValue[],
  parameters: string[],
  defaults: Record<string, RobotValue> = {}
): Record<string, RobotValue> {
  const last = args.at(-1);
  const namedValues = last instanceof Named ? last.values : {};
  const positional = last instanceof Named ? args.slice(0, -1) : args;
  const result: Record<string, RobotValue> = { ...defaults };
  let index = 0;
  for (const parameter of parameters) {
    if (parameter.startsWith("*")) {
      result[parameter.slice(1)] = positional.slice(index);
      index = positional.length;
      continue;
    }
    if (index < positional.length) {
      result[parameter] = positional[index];
      index++;
    }
  }
  for (const [name, value] of Object.entries(namedValues)) {
    result[name] = value;
  }
  return result;
}

/**
 * A user keyword's named-only arguments (the ones after `@{varargs}` in [Arguments]) from a trailing
 * `named()` in its rest arguments. Returns the positional rest and the named values with their defaults.
 */
export function namedOnly(
  rest: RobotValue[],
  defaults: Record<string, RobotValue>
): [RobotValue[], Record<string, RobotValue>] {
  const last = rest.at(-1);
  if (last instanceof Named) {
    return [rest.slice(0, -1), { ...defaults, ...last.values }];
  }
  return [rest, { ...defaults }];
}

/** Joins a Robot selector that starts with an element reference: `${element} >> child`. */
export function chain(element: RobotValue, rest: string): RobotValue {
  if (typeof element === "string") {
    return `${element} >> ${rest}`;
  }
  return element.locator(rest);
}
