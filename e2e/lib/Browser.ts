import { chromium, devices, expect, firefox, webkit } from "@playwright/test";
/**
 * The Robot Framework Browser library keywords the suite uses, with the same names and semantics
 * (robotframework-browser 19.12.0). The Browser library is Playwright underneath, so selectors are unchanged.
 */
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import type { BrowserContext, Download, Locator, Page, Browser as PlaywrightBrowser, Response } from "@playwright/test";
import { argsOf, isSecret, isTruthy, library, named, onTestEnd, redact, sleepMs, testInfo, timeToMs } from "./robot";
import type { RobotValue } from "./robot";

interface PageEntry {
  id: string;
  page: Page;
}

interface ContextEntry {
  id: string;
  context: BrowserContext;
  pages: PageEntry[];
  activePage: PageEntry | null;
  // A Playwright trace is recorded (PW_TRACE=on)
  tracing: boolean;
  // The HAR file Playwright writes when the context closes (recordHar)
  harPath: string | null;
}

interface BrowserEntry {
  id: string;
  browser: PlaywrightBrowser;
  contexts: ContextEntry[];
  activeContext: ContextEntry | null;
}

const DEFAULT_TIMEOUT = 10_000;
// Browser library's retry_assertions_for default
const RETRY_ASSERTIONS_FOR = 1000;

const state = {
  browsers: [] as BrowserEntry[],
  browser: null as BrowserEntry | null,
  timeout: DEFAULT_TIMEOUT,
  strict: true,
  counter: 0,
};

function nextId(prefix: string): string {
  state.counter++;
  return `${prefix}=${state.counter}`;
}

function currentContext(): ContextEntry {
  const context = state.browser?.activeContext;
  if (context == null) {
    throw new Error("No context open. Use New Context or New Page first.");
  }
  return context;
}

/** The page the Browser library keywords act on. */
export function currentPage(): Page {
  const page = state.browser?.activeContext?.activePage?.page;
  if (page == null) {
    throw new Error("No page open. Use New Page first.");
  }
  return page;
}

export function browserTimeout(): number {
  return state.timeout;
}

/** A Locator for a Robot selector string or an element reference returned by Get Element(s). */
export function loc(selector: RobotValue): Locator {
  const locator: Locator = typeof selector === "string" ? currentPage().locator(selector) : selector;
  return state.strict ? locator : locator.first();
}

function timeoutOf(value: RobotValue): number {
  return value == null || value === "" ? state.timeout : timeToMs(value);
}

function describe(selector: RobotValue): string {
  return typeof selector === "string" ? selector : String(selector);
}

// Browser library assertion operators used by the getters
function assertionPasses(value: RobotValue, operator: string, expected: RobotValue): boolean {
  const actual = value;
  switch (operator.trim().toLowerCase()) {
    case "==":
    case "equal":
    case "equals":
    case "should be":
      return String(actual) === String(expected);
    case "!=":
    case "inequal":
    case "should not be":
      return String(actual) !== String(expected);
    case "*=":
    case "contains":
      return String(actual).includes(String(expected));
    case "not contains":
      return !String(actual).includes(String(expected));
    case "^=":
    case "should start with":
    case "starts":
      return String(actual).startsWith(String(expected));
    case "$=":
    case "should end with":
    case "ends":
      return String(actual).endsWith(String(expected));
    case "matches":
      return new RegExp(String(expected)).test(String(actual));
    case ">":
      return Number(actual) > Number(expected);
    case "<":
      return Number(actual) < Number(expected);
    case ">=":
      return Number(actual) >= Number(expected);
    case "<=":
      return Number(actual) <= Number(expected);
    default:
      throw new Error(`Assertion operator "${operator}" is not supported in the port`);
  }
}

/** Runs a getter, and when an assertion operator is given, retries it like the Browser library does. */
async function verified(
  get: () => RobotValue,
  operator: RobotValue,
  expected: RobotValue,
  message: RobotValue
): Promise<RobotValue> {
  if (operator == null || operator === "") {
    return get();
  }
  let failingSince: number | null = null;
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- polling until the assertion passes
    const value = await get();
    if (assertionPasses(value, String(operator), expected)) {
      return value;
    }
    failingSince ??= Date.now();
    if (Date.now() - failingSince > RETRY_ASSERTIONS_FOR) {
      const prefix = message == null || message === "" ? "" : `${String(message)} `;
      throw new Error(`${prefix}'${String(value)}' ${String(operator)} '${String(expected)}' failed`);
    }
    // oxlint-disable-next-line no-await-in-loop -- polling interval
    await sleepMs(100);
  }
}

/** Browser library's text getter: the value of inputs and textareas, otherwise innerText. */
async function textOf(locator: Locator, timeout: number): Promise<string> {
  const handle = await locator.elementHandle({ timeout });
  if (handle == null) {
    throw new Error("Locator did not resolve to elementHandle.");
  }
  const tag = String(await (await handle.getProperty("tagName")).jsonValue());
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return String(await (await handle.getProperty("value")).jsonValue());
  }
  // innerText like the Browser library, not textContent (it skips hidden text)
  // oxlint-disable-next-line unicorn/prefer-dom-node-text-content
  return handle.innerText();
}

async function waitForElementsState(selector: RobotValue, wanted: string, timeout: number): Promise<void> {
  const locator = loc(selector);
  if (["attached", "detached", "visible", "hidden"].includes(wanted)) {
    await locator.waitFor({ state: wanted as "attached" | "detached" | "visible" | "hidden", timeout });
    return;
  }
  if (["stable", "enabled", "disabled", "editable"].includes(wanted)) {
    const handle = await locator.elementHandle({ timeout });
    if (handle == null) {
      throw new Error(`Element ${describe(selector)} not found`);
    }
    await handle.waitForElementState(wanted as "stable" | "enabled" | "disabled" | "editable", { timeout });
    return;
  }
  const checks: Record<string, (element: Element) => boolean> = {
    readonly: (element) => (element as HTMLInputElement).readOnly,
    selected: (element) => (element as HTMLOptionElement).selected,
    deselected: (element) => !(element as HTMLOptionElement).selected,
    focused: (element) => document.activeElement === element,
    defocused: (element) => document.activeElement !== element,
    checked: (element) => (element as HTMLInputElement).checked,
    unchecked: (element) => !(element as HTMLInputElement).checked,
  };
  const check = checks[wanted];
  if (check == null) {
    throw new Error(`Element state "${wanted}" is not supported in the port`);
  }
  await expect.poll(() => locator.evaluate(check), { timeout }).toBe(true);
}

/** The promise's value, or `expired` if it doesn't settle within `ms` milliseconds (0 waits without a limit). */
export async function within<T, E>(promise: Promise<T>, ms: number, expired: E): Promise<T | E> {
  if (ms <= 0) {
    return promise;
  }
  const timer = new AbortController();
  try {
    return await Promise.race([promise, delay(ms, expired, { signal: timer.signal })]);
  } finally {
    timer.abort();
  }
}

/** A response's body as the Browser library reads it: the parsed JSON, else the text, else null. */
async function readBody(response: Response): Promise<RobotValue> {
  try {
    return await response.json();
  } catch {
    return response.text().catch(() => null);
  }
}

function responseDetails(response: Response, body: RobotValue): Record<string, RobotValue> {
  const request = response.request();
  return {
    url: response.url(),
    status: response.status(),
    statusText: response.statusText(),
    ok: response.ok(),
    headers: response.headers(),
    body,
    request: { method: request.method(), url: request.url(), postData: request.postData(), headers: request.headers() },
  };
}

/** Hides secrets in a HAR file, like in the logs. */
async function redactHarFile(path: string): Promise<void> {
  // A .zip HAR is an archive, not text; the suite writes .har files
  if (path.endsWith(".zip")) {
    return;
  }
  const text = await readFile(path, "utf8");
  const hidden = redact(text);
  if (hidden !== text) {
    await writeFile(path, hidden);
  }
}

/**
 * Closes a context like the Browser library does: the trace is saved first, and closing the context writes the
 * HAR file of a context made with recordHar (Playwright saves neither when only the browser is closed).
 * The trace is saved only in the test's results folder and not attached to the HTML report.
 */
async function closeContextEntry(entry: ContextEntry): Promise<void> {
  if (entry.tracing) {
    entry.tracing = false;
    await entry.context.tracing.stop({ path: testInfo().outputPath(`trace-${entry.id}.zip`) });
  }
  await entry.context.close();
  if (entry.harPath != null) {
    await redactHarFile(entry.harPath);
  }
}

async function closeBrowserEntry(entry: BrowserEntry): Promise<void> {
  state.browsers = state.browsers.filter((browser) => browser !== entry);
  // Every context is closed even if one fails, so their HAR files and traces aren't lost
  let failure: unknown = null;
  for (const context of entry.contexts) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- one by one, like the Browser library
      await closeContextEntry(context);
    } catch (err) {
      failure ??= err;
    }
  }
  await entry.browser.close();
  state.browser = state.browsers.at(-1) ?? null;
  if (failure != null) {
    throw failure;
  }
}

// Close everything a test left open. Robot ran each test in its own pabot process, which did the same.
onTestEnd(async () => {
  for (const entry of state.browsers) {
    // oxlint-disable-next-line no-await-in-loop -- closing one by one keeps the errors readable
    await closeBrowserEntry(entry).catch(() => undefined);
  }
  state.browsers = [];
  state.browser = null;
  state.timeout = DEFAULT_TIMEOUT;
  state.strict = true;
});

const LAUNCHERS = { chromium, firefox, webkit };

const BOOLEAN_CONTEXT_OPTIONS = new Set([
  "acceptDownloads",
  "bypassCSP",
  "hasTouch",
  "ignoreHTTPSErrors",
  "isMobile",
  "javaScriptEnabled",
  "offline",
]);
const NUMBER_CONTEXT_OPTIONS = new Set(["deviceScaleFactor"]);

/** A Python literal like "{'width': 1440, 'height': 900}" as Robot passes it in a VAR dictionary. */
function pythonLiteral(text: string): RobotValue {
  const json = text
    .replaceAll("'", '"')
    .replaceAll(/\bTrue\b/g, "true")
    .replaceAll(/\bFalse\b/g, "false")
    .replaceAll(/\bNone\b/g, "null");
  return JSON.parse(json);
}

/** Converts context options from Robot strings to typed values, like the Browser library's argument types. */
function contextOptions(options: Record<string, RobotValue>): Record<string, RobotValue> {
  const converted: Record<string, RobotValue> = {};
  for (const [name, value] of Object.entries(options)) {
    if (typeof value !== "string") {
      converted[name] = value;
    } else if (BOOLEAN_CONTEXT_OPTIONS.has(name)) {
      converted[name] = isTruthy(value);
    } else if (NUMBER_CONTEXT_OPTIONS.has(name)) {
      converted[name] = Number(value);
    } else if (value.trim().startsWith("{")) {
      converted[name] = pythonLiteral(value);
    } else {
      converted[name] = value;
    }
  }
  return converted;
}

/** A started keyword (Promise To). It never rejects, so Node doesn't see an unhandled rejection meanwhile. */
interface Settled {
  settled: Promise<{ ok: true; value: RobotValue } | { ok: false; error: unknown }>;
}

function settle(run: () => Promise<RobotValue>): Settled {
  const settled = (async () => {
    try {
      return { ok: true as const, value: await run() };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  })();
  return { settled };
}

async function unwrap(promise: RobotValue): Promise<RobotValue> {
  if (promise == null || typeof promise !== "object" || !("settled" in promise)) {
    return await promise;
  }
  const result = await (promise as Settled).settled;
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

const isActive = (value: RobotValue) => ["ACTIVE", "CURRENT"].includes(String(value).toUpperCase());

export const Browser = library("Browser", {
  "New Browser": async (...args: RobotValue[]) => {
    const {
      browser,
      headless,
      args: launchArgs,
      devtools: _devtools,
      reuse_existing: _reuse,
    } = argsOf(args, ["browser", "headless"], { browser: "chromium", headless: true, args: [] });
    const launcher = LAUNCHERS[String(browser) as keyof typeof LAUNCHERS];
    if (launcher == null) {
      throw new Error(`Unknown browser "${String(browser)}"`);
    }
    const launched = await launcher.launch({ headless: isTruthy(headless), args: launchArgs });
    const entry: BrowserEntry = { id: nextId("browser"), browser: launched, contexts: [], activeContext: null };
    state.browsers.push(entry);
    state.browser = entry;
    return entry.id;
  },

  "New Context": async (...args: RobotValue[]) => {
    const options = contextOptions(argsOf(args, []));
    // Device descriptors from Get Device carry the browser type, which is not a context option
    Reflect.deleteProperty(options, "defaultBrowserType");
    if (state.browser == null) {
      await Browser["New Browser"]();
    }
    const browser = state.browser as unknown as BrowserEntry;
    const context = await browser.browser.newContext(options);
    context.setDefaultTimeout(state.timeout);
    context.setDefaultNavigationTimeout(state.timeout);
    // Traces are for local debugging only, so they aren't recorded in CI
    let tracing = process.env.PW_TRACE === "on";
    if (tracing && process.env.CI != null) {
      tracing = false;
      testInfo().annotations.push({ type: "warning", description: "PW_TRACE=on is ignored in CI" });
    }
    if (tracing) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    const harPath = typeof options.recordHar?.path === "string" ? options.recordHar.path : null;
    const entry: ContextEntry = { id: nextId("context"), context, pages: [], activePage: null, tracing, harPath };
    context.on("page", (page) => {
      if (!entry.pages.some((known) => known.page === page)) {
        entry.pages.push({ id: nextId("page"), page });
      }
    });
    browser.contexts.push(entry);
    browser.activeContext = entry;
    return entry.id;
  },

  "New Page": async (...args: RobotValue[]) => {
    const { url } = argsOf(args, ["url"]);
    if (state.browser?.activeContext == null) {
      await Browser["New Context"]();
    }
    const context = currentContext();
    const page = await context.context.newPage();
    const entry = context.pages.find((known) => known.page === page) ?? { id: nextId("page"), page };
    if (!context.pages.includes(entry)) {
      context.pages.push(entry);
    }
    context.activePage = entry;
    if (url != null && url !== "") {
      await page.goto(String(url), { waitUntil: "load", timeout: state.timeout });
    }
    return { page_id: entry.id, video_path: null };
  },

  "Switch Browser": (id: RobotValue) => {
    const entry = state.browsers.find((browser) => browser.id === String(id));
    if (entry == null) {
      throw new Error(`No browser with id ${String(id)}`);
    }
    const previous = state.browser?.id ?? null;
    state.browser = entry;
    return previous;
  },

  "Switch Page": async (id: RobotValue) => {
    const pageId = typeof id === "object" && id != null && "page_id" in id ? String(id.page_id) : String(id);
    const context = currentContext();
    const previous = context.activePage?.id ?? null;
    if (pageId === "NEW") {
      const latest = context.pages.at(-1);
      if (latest == null) {
        throw new Error("No new page to switch to");
      }
      context.activePage = latest;
    } else if (pageId !== "CURRENT") {
      let switched = false;
      for (const browser of state.browsers) {
        for (const candidate of browser.contexts) {
          // A closed page is gone, like in the Browser library
          const found = candidate.pages.find((page) => page.id === pageId && !page.page.isClosed());
          if (found != null) {
            state.browser = browser;
            browser.activeContext = candidate;
            candidate.activePage = found;
            switched = true;
          }
        }
      }
      if (!switched) {
        throw new Error(`No page with requested id '${pageId}' found.`);
      }
    }
    await currentPage().bringToFront();
    return previous;
  },

  "Get Browser Ids": (...args: RobotValue[]) => {
    const { browser } = argsOf(args, ["browser"], { browser: "ALL" });
    if (String(browser).toUpperCase() === "ALL") {
      return state.browsers.map((entry) => entry.id);
    }
    return state.browser == null ? [] : [state.browser.id];
  },

  "Get Page Ids": (...args: RobotValue[]) => {
    const { page, context, browser } = argsOf(args, ["page", "context", "browser"], {
      page: "ALL",
      context: "ALL",
      browser: "ALL",
    });
    const browsers = isActive(browser) ? (state.browser == null ? [] : [state.browser]) : state.browsers;
    const ids: string[] = [];
    for (const entry of browsers) {
      const contexts = isActive(context) ? (entry.activeContext == null ? [] : [entry.activeContext]) : entry.contexts;
      for (const candidate of contexts) {
        const pages = isActive(page) ? (candidate.activePage == null ? [] : [candidate.activePage]) : candidate.pages;
        ids.push(...pages.map((known) => known.id));
      }
    }
    return ids;
  },

  "Close Browser": async (...args: RobotValue[]) => {
    const { browser } = argsOf(args, ["browser"], { browser: "CURRENT" });
    if (String(browser).toUpperCase() === "ALL") {
      for (const entry of state.browsers) {
        // oxlint-disable-next-line no-await-in-loop -- one by one
        await closeBrowserEntry(entry);
      }
      return;
    }
    const entry =
      String(browser).toUpperCase() === "CURRENT"
        ? state.browser
        : (state.browsers.find((candidate) => candidate.id === String(browser)) ?? null);
    if (entry == null) {
      throw new Error("No browser to close");
    }
    await closeBrowserEntry(entry);
  },

  "Get Device": (name: RobotValue) => {
    const device = devices[String(name)];
    if (device == null) {
      throw new Error(`No device "${String(name)}"`);
    }
    return structuredClone(device);
  },

  "Set Browser Timeout": (...args: RobotValue[]) => {
    const { timeout } = argsOf(args, ["timeout", "scope"]);
    const previous = `${state.timeout / 1000} seconds`;
    state.timeout = timeToMs(timeout);
    for (const browser of state.browsers) {
      for (const context of browser.contexts) {
        context.context.setDefaultTimeout(state.timeout);
        context.context.setDefaultNavigationTimeout(state.timeout);
      }
    }
    return previous;
  },

  "Set Strict Mode": (...args: RobotValue[]) => {
    const { mode } = argsOf(args, ["mode", "scope"]);
    const previous = state.strict;
    state.strict = isTruthy(mode);
    return previous;
  },

  "Go To": async (...args: RobotValue[]) => {
    const { url, timeout } = argsOf(args, ["url", "timeout"]);
    const response = await currentPage().goto(String(url), { waitUntil: "load", timeout: timeoutOf(timeout) });
    return response?.status() ?? null;
  },

  Reload: async () => {
    await currentPage().reload({ waitUntil: "load", timeout: state.timeout });
  },

  "Wait For Load State": async (...args: RobotValue[]) => {
    const { state: loadState, timeout } = argsOf(args, ["state", "timeout"], { state: "load" });
    await currentPage().waitForLoadState(String(loadState) as "load" | "domcontentloaded" | "networkidle", {
      timeout: timeoutOf(timeout),
    });
  },

  "Get Url": (...args: RobotValue[]) => {
    const { assertion_operator, assertion_expected, message } = argsOf(args, [
      "assertion_operator",
      "assertion_expected",
      "message",
    ]);
    return verified(() => currentPage().url(), assertion_operator, assertion_expected, message);
  },

  Click: async (...args: RobotValue[]) => {
    const { selector } = argsOf(args, ["selector"]);
    await loc(selector).click({ timeout: state.timeout });
  },

  "Fill Text": async (...args: RobotValue[]) => {
    const { selector, txt, force } = argsOf(args, ["selector", "txt"], { force: false });
    await loc(selector).fill(String(txt), { force: isTruthy(force), timeout: state.timeout });
  },

  "Type Text": async (...args: RobotValue[]) => {
    const { selector, txt, delay, clear } = argsOf(args, ["selector", "txt", "delay", "clear"], {
      delay: "0 ms",
      clear: true,
    });
    const locator = loc(selector);
    if (isTruthy(clear)) {
      await locator.fill("", { timeout: state.timeout });
    }
    if (isSecret(txt)) {
      // Typing would put the secret in the report's step titles, so set the value instead
      await locator.evaluate((element, value) => {
        const input = element as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, String(txt));
      return;
    }
    await locator.pressSequentially(String(txt), { delay: timeToMs(delay), timeout: state.timeout });
  },

  Focus: async (selector: RobotValue) => {
    await loc(selector).focus({ timeout: state.timeout });
  },

  "Scroll To Element": async (selector: RobotValue) => {
    await loc(selector).scrollIntoViewIfNeeded({ timeout: state.timeout });
  },

  "Keyboard Key": async (action: RobotValue, key: RobotValue) => {
    const keyboard = currentPage().keyboard;
    if (String(action) === "down") {
      await keyboard.down(String(key));
    } else if (String(action) === "up") {
      await keyboard.up(String(key));
    } else {
      await keyboard.press(String(key));
    }
  },

  "Select Options By": (...args: RobotValue[]) => {
    const { selector, attribute, values } = argsOf(args, ["selector", "attribute", "*values"]);
    const options = (values as RobotValue[]).map((value) => {
      switch (String(attribute)) {
        case "label":
        case "text":
          return { label: String(value) };
        case "index":
          return { index: Number(value) };
        default:
          return { value: String(value) };
      }
    });
    return loc(selector).selectOption(options, { timeout: state.timeout });
  },

  "Wait For Elements State": async (...args: RobotValue[]) => {
    const {
      selector,
      state: wanted,
      timeout,
      message,
    } = argsOf(args, ["selector", "state", "timeout", "message"], {
      state: "visible",
    });
    const timeoutMs = timeoutOf(timeout);
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- retried until the timeout like the Browser library
        await waitForElementsState(selector, String(wanted), Math.max(deadline - Date.now(), 1));
        return;
      } catch (err) {
        if (Date.now() < deadline) {
          // oxlint-disable-next-line no-await-in-loop -- retry interval
          await sleepMs(100);
          continue;
        }
        if (message != null && message !== "") {
          throw new Error(
            String(message)
              .replaceAll("{selector}", describe(selector))
              .replaceAll("{function}", String(wanted))
              .replaceAll("{timeout}", `${timeoutMs / 1000} seconds`),
            { cause: err }
          );
        }
        throw err;
      }
    }
  },

  "Get Text": (...args: RobotValue[]) => {
    const { selector, assertion_operator, assertion_expected, message } = argsOf(args, [
      "selector",
      "assertion_operator",
      "assertion_expected",
      "message",
    ]);
    return verified(() => textOf(loc(selector), state.timeout), assertion_operator, assertion_expected, message);
  },

  "Get Attribute": async (...args: RobotValue[]) => {
    const { selector, attribute, assertion_operator, assertion_expected, message } = argsOf(args, [
      "selector",
      "attribute",
      "assertion_operator",
      "assertion_expected",
      "message",
    ]);
    const locator = loc(selector);
    await locator.waitFor({ state: "attached", timeout: state.timeout });
    return verified(
      async () => {
        const value = await locator.getAttribute(String(attribute), { timeout: state.timeout });
        if (value == null && (assertion_operator == null || assertion_operator === "")) {
          throw new Error(`Attribute '${String(attribute)}' not found!`);
        }
        return value;
      },
      assertion_operator,
      assertion_expected,
      message
    );
  },

  "Get Property": async (...args: RobotValue[]) => {
    const { selector, property, assertion_operator, assertion_expected, message } = argsOf(args, [
      "selector",
      "property",
      "assertion_operator",
      "assertion_expected",
      "message",
    ]);
    const locator = loc(selector);
    await locator.waitFor({ state: "attached", timeout: state.timeout });
    return verified(
      () =>
        locator.evaluate((element, name) => (element as unknown as Record<string, unknown>)[name], String(property)),
      assertion_operator,
      assertion_expected,
      message
    );
  },

  "Get Element Count": (...args: RobotValue[]) => {
    const { selector, assertion_operator, assertion_expected, message } = argsOf(args, [
      "selector",
      "assertion_operator",
      "assertion_expected",
      "message",
    ]);
    const locator = typeof selector === "string" ? currentPage().locator(selector) : (selector as Locator);
    return verified(() => locator.count(), assertion_operator, assertion_expected, message);
  },

  "Get Element": async (selector: RobotValue) => {
    const locator = loc(selector);
    await locator.waitFor({ state: "attached", timeout: state.timeout });
    return locator;
  },

  "Get Elements": async (selector: RobotValue) => {
    // Waits for the first match like the Browser library, and returns an empty list when none appear
    const locator = typeof selector === "string" ? currentPage().locator(selector) : (selector as Locator);
    try {
      await locator.first().waitFor({ state: "attached", timeout: state.timeout });
    } catch {
      return [];
    }
    return locator.all();
  },

  "Evaluate JavaScript": (...args: RobotValue[]) => {
    const { selector, expression, arg } = argsOf(args, ["selector", "*expression"]);
    const [script, argument] = expression as [RobotValue, RobotValue];
    if (typeof script !== "function") {
      throw new TypeError("Evaluate JavaScript takes a function in the port");
    }
    if (selector == null || selector === "") {
      return currentPage().evaluate(script, argument ?? arg);
    }
    return loc(selector).evaluate(script, argument ?? arg);
  },

  "Get Cookies": async (...args: RobotValue[]) => {
    const { return_type } = argsOf(args, ["return_type"], { return_type: "dictionary" });
    const cookies = await currentContext().context.cookies();
    // The Browser library returns an empty list when there are no cookies, whatever the return type
    if (cookies.length === 0) {
      return [];
    }
    if (String(return_type) === "string") {
      return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    }
    return cookies;
  },

  "Get Viewport Size": () => currentPage().viewportSize(),

  "Take Screenshot": async (...args: RobotValue[]) => {
    const { filename } = argsOf(args, ["filename"], { filename: "EMBED" });
    const body = await currentPage().screenshot({ fullPage: false });
    if (String(filename) === "EMBED") {
      await testInfo().attach("screenshot", { body, contentType: "image/png" });
      return "EMBED";
    }
    const path = testInfo().outputPath(`${String(filename)}.png`);
    await writeFile(path, body);
    return path;
  },

  /** Starts a keyword without waiting for it. `Wait For` waits for the result. */
  "Promise To": (keyword: RobotValue, ...args: RobotValue[]) => settle(async () => await keyword(...args)),

  "Wait For": async (...promises: RobotValue[]) => {
    const results = await Promise.all(promises.map((promise: RobotValue) => unwrap(promise)));
    return results.length === 1 ? results[0] : results;
  },

  "Wait For Response": async (...args: RobotValue[]) => {
    const { matcher, timeout } = argsOf(args, ["matcher", "timeout"]);
    const limit = timeoutOf(timeout);
    const response = await currentPage().waitForResponse(matcher, { timeout: limit });
    // Like the Browser library, continue without the body when it can't be read. The body of a response from a page
    // that is being reloaded may never finish, so stop waiting after the keyword's timeout (the library waits forever).
    const unread = Symbol("unread");
    const body = await within(readBody(response), limit, unread);
    if (body === unread) {
      testInfo().annotations.push({
        type: "warning",
        description: `Wait For Response: the body of ${response.url()} didn't finish in ${limit} ms, continuing without it`,
      });
      return responseDetails(response, null);
    }
    return responseDetails(response, body);
  },

  "Promise To Wait For Download": (...args: RobotValue[]) => {
    const { saveAs, wait_for_finished } = argsOf(args, ["saveAs", "wait_for_finished"], { wait_for_finished: true });
    const page = currentPage();
    return settle(async () => {
      const download: Download = await page.waitForEvent("download", { timeout: state.timeout });
      const target =
        saveAs != null && saveAs !== "" ? String(saveAs) : testInfo().outputPath(download.suggestedFilename());
      if (isTruthy(wait_for_finished)) {
        await download.saveAs(target);
      }
      return { saveAs: target, suggestedFilename: download.suggestedFilename() };
    });
  },
});

/** Used in step titles of other shims. */
export const describeSelector = (selector: RobotValue): string => redact(describe(selector));

export { named };
