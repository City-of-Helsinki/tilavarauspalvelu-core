/** Robot Framework BuiltIn library keywords the suite uses, with the same names. */
import { test } from "@playwright/test";
import {
  argsOf,
  errorMessage,
  formatValue,
  isSkip,
  isTruthy,
  KEYWORD_REGISTRY,
  library,
  logLevel,
  redact,
  robot,
  setLogLevel,
  sleepMs,
  step,
  str,
  testInfo,
  timeToMs,
} from "./robot";
import type { Keyword, RobotValue } from "./robot";

/** Robot's `Run Keyword`: a keyword function, or a name like "mybookings.Check Reservation Status". */
export function runKeyword(keyword: RobotValue, ...args: RobotValue[]): Promise<RobotValue> {
  if (typeof keyword === "function") {
    return Promise.resolve((keyword as Keyword)(...args));
  }
  const name = String(keyword);
  const exact = KEYWORD_REGISTRY.get(name);
  const matches = exact == null ? [...KEYWORD_REGISTRY.values()].filter((entry) => entry.name === name) : [exact];
  const [match] = matches;
  if (match == null || matches.length > 1) {
    throw new Error(matches.length > 1 ? `Multiple keywords with name '${name}' found` : `No keyword '${name}' found`);
  }
  return step(`${match.module}.${match.name}`, () => match.implementation(...args));
}

function failure(message: RobotValue, values: boolean, detail: string): Error {
  if (message == null || message === "") {
    return new Error(detail);
  }
  return new Error(values ? `${String(message)}: ${detail}` : String(message));
}

function normalizeText(value: RobotValue, stripSpaces: RobotValue, ignoreCase: RobotValue): RobotValue {
  if (typeof value !== "string") {
    return value;
  }
  let text = value;
  if (isTruthy(stripSpaces)) {
    text = text.trim();
  }
  if (isTruthy(ignoreCase)) {
    text = text.toLowerCase();
  }
  return text;
}

function typeName(value: RobotValue): string {
  if (typeof value === "string") {
    return "string";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "float";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return value == null ? "None" : "object";
}

function sameValue(first: RobotValue, second: RobotValue): boolean {
  if (typeof first === "object" && typeof second === "object" && first != null && second != null) {
    return JSON.stringify(first) === JSON.stringify(second);
  }
  return first === second;
}

function describeInequality(first: RobotValue, second: RobotValue): string {
  if (typeName(first) !== typeName(second)) {
    return `${str(first)} (${typeName(first)}) != ${str(second)} (${typeName(second)})`;
  }
  return `${str(first)} != ${str(second)}`;
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

const LOG_LEVELS = ["TRACE", "DEBUG", "INFO", "HTML", "WARN", "ERROR", "NONE"];

export const BuiltIn = library("BuiltIn", {
  Log: async (...args: RobotValue[]) => {
    const { message, level, console } = argsOf(args, ["message", "level"], { level: "INFO" });
    const text = redact(formatValue(message));
    const upper = String(level).toUpperCase();
    // Robot's log level: messages below it are not logged (Set Log Level NONE hides everything)
    if (LOG_LEVELS.indexOf(upper) < LOG_LEVELS.indexOf(logLevel())) {
      return;
    }
    if (upper === "WARN" || upper === "ERROR") {
      testInfo().annotations.push({ type: upper === "WARN" ? "warning" : "error", description: text });
    }
    if (isTruthy(console ?? false)) {
      process.stdout.write(`${text}\n`);
    }
    await step(`Log    ${text.length > 200 ? `${text.slice(0, 197)}...` : text}`, () => undefined);
  },

  Sleep: async (time: RobotValue, reason?: RobotValue) => {
    await sleepMs(timeToMs(time));
    return reason;
  },

  Fail: (...args: RobotValue[]) => {
    const { msg } = argsOf(args, ["msg"], { msg: "AssertionError" });
    throw new Error(String(msg));
  },

  Skip: (...args: RobotValue[]) => {
    const { msg } = argsOf(args, ["msg"], { msg: "Skipped with Skip keyword." });
    test.skip(true, String(msg));
  },

  "Should Be Equal": (...args: RobotValue[]) => {
    const { first, second, msg, values, ignore_case, strip_spaces } = argsOf(
      args,
      ["first", "second", "msg", "values"],
      {
        values: true,
      }
    );
    const left = normalizeText(first, strip_spaces, ignore_case);
    const right = normalizeText(second, strip_spaces, ignore_case);
    if (!sameValue(left, right)) {
      throw failure(msg, isTruthy(values), describeInequality(first, second));
    }
  },

  "Should Not Be Equal": (...args: RobotValue[]) => {
    const { first, second, msg, values } = argsOf(args, ["first", "second", "msg", "values"], { values: true });
    if (sameValue(first, second)) {
      throw failure(msg, isTruthy(values), `${str(first)} == ${str(second)}`);
    }
  },

  "Should Be Equal As Integers": (...args: RobotValue[]) => {
    const { first, second, msg, values } = argsOf(args, ["first", "second", "msg", "values"], { values: true });
    const left = Number.parseInt(String(first), 10);
    const right = Number.parseInt(String(second), 10);
    if (left !== right) {
      throw failure(msg, isTruthy(values), `${left} != ${right}`);
    }
  },

  "Should Be Equal As Numbers": (...args: RobotValue[]) => {
    const { first, second, msg, values } = argsOf(args, ["first", "second", "msg", "values"], { values: true });
    if (Number(first) !== Number(second)) {
      throw failure(msg, isTruthy(values), `${Number(first)} != ${Number(second)}`);
    }
  },

  "Should Be Equal As Strings": (...args: RobotValue[]) => {
    const { first, second, msg, values } = argsOf(args, ["first", "second", "msg", "values"], { values: true });
    if (str(first) !== str(second)) {
      throw failure(msg, isTruthy(values), `${str(first)} != ${str(second)}`);
    }
  },

  "Should Not Be Equal As Strings": (...args: RobotValue[]) => {
    const { first, second, msg, values } = argsOf(args, ["first", "second", "msg", "values"], { values: true });
    if (str(first) === str(second)) {
      throw failure(msg, isTruthy(values), `${str(first)} == ${str(second)}`);
    }
  },

  "Should Be True": (...args: RobotValue[]) => {
    const { condition, msg } = argsOf(args, ["condition", "msg"]);
    if (!isTruthy(condition)) {
      throw new Error(msg == null || msg === "" ? `'${str(condition)}' should be true.` : String(msg));
    }
  },

  "Should Contain": (...args: RobotValue[]) => {
    const { container, item, msg, values, ignore_case, strip_spaces } = argsOf(args, [
      "container",
      "item",
      "msg",
      "values",
    ]);
    const wanted = normalizeText(item, strip_spaces, ignore_case);
    const found = Array.isArray(container)
      ? container.some((entry) => sameValue(normalizeText(entry, strip_spaces, ignore_case), wanted))
      : String(normalizeText(container, strip_spaces, ignore_case)).includes(String(wanted));
    if (!found) {
      throw failure(msg, isTruthy(values ?? true), `'${str(container)}' does not contain '${str(item)}'`);
    }
  },

  "Should Not Be Empty": (...args: RobotValue[]) => {
    const { item, msg } = argsOf(args, ["item", "msg"]);
    const length = item == null ? 0 : (item.length ?? Object.keys(item).length);
    if (length === 0) {
      throw new Error(msg == null || msg === "" ? `'${str(item)}' should not be empty.` : String(msg));
    }
  },

  "Should Match Regexp": (...args: RobotValue[]) => {
    const { string, pattern, msg } = argsOf(args, ["string", "pattern", "msg"]);
    const match = new RegExp(String(pattern)).exec(String(string));
    if (match == null) {
      throw new Error(
        msg == null || msg === "" ? `'${String(string)}' does not match '${String(pattern)}'` : String(msg)
      );
    }
    return match[0];
  },

  "Should Start With": (...args: RobotValue[]) => {
    const { str1, str2, msg } = argsOf(args, ["str1", "str2", "msg"]);
    if (!String(str1).startsWith(String(str2))) {
      throw new Error(
        msg == null || msg === "" ? `'${String(str1)}' does not start with '${String(str2)}'` : String(msg)
      );
    }
  },

  "Run Keyword": (keyword: RobotValue, ...args: RobotValue[]) => runKeyword(keyword, ...args),

  "Run Keyword And Return Status": async (keyword: RobotValue, ...args: RobotValue[]) => {
    try {
      await runKeyword(keyword, ...args);
      return true;
    } catch (err) {
      // A Skip inside must still skip, like in Robot
      if (isSkip(err)) {
        throw err;
      }
      return false;
    }
  },

  "Run Keyword And Ignore Error": async (keyword: RobotValue, ...args: RobotValue[]) => {
    try {
      return ["PASS", await runKeyword(keyword, ...args)];
    } catch (err) {
      return ["FAIL", errorMessage(err)];
    }
  },

  "Run Keyword If Test Failed": (keyword: RobotValue, ...args: RobotValue[]) => {
    if (robot.TEST_STATUS === "FAIL") {
      return runKeyword(keyword, ...args);
    }
    return null;
  },

  /** `retry` is a time ("10s") or a count ("3x"), like in Robot. */
  "Wait Until Keyword Succeeds": async (
    retry: RobotValue,
    retry_interval: RobotValue,
    keyword: RobotValue,
    ...args: RobotValue[]
  ) => {
    const interval = timeToMs(retry_interval);
    const countMatch = /^\s*(\d+)\s*(x|times?)\s*$/i.exec(String(retry));
    const maxAttempts = countMatch == null ? Number.POSITIVE_INFINITY : Number.parseInt(countMatch[1] ?? "1", 10);
    const deadline = countMatch == null ? Date.now() + timeToMs(retry) : Number.POSITIVE_INFINITY;
    let attempt = 0;
    for (;;) {
      attempt++;
      try {
        // oxlint-disable-next-line no-await-in-loop -- retried until it passes
        return await runKeyword(keyword, ...args);
      } catch (err) {
        if (isSkip(err)) {
          throw err;
        }
        // Like Robot, a new attempt is made unless the time is already up, even if it starts after the deadline
        if (attempt >= maxAttempts || Date.now() > deadline) {
          const detail = errorMessage(err);
          const limit = countMatch == null ? String(retry) : `${maxAttempts} times`;
          throw new Error(
            `Keyword '${formatValue(keyword)}' failed after retrying ${limit}. The last error was: ${detail}`,
            {
              cause: err,
            }
          );
        }
        // oxlint-disable-next-line no-await-in-loop -- retry interval
        await sleepMs(interval);
      }
    }
  },

  "Set Log Level": (level: RobotValue) => setLogLevel(String(level)),

  Catenate: (...items: RobotValue[]) => {
    const [first] = items;
    if (typeof first === "string" && first.startsWith("SEPARATOR=")) {
      return items
        .slice(1)
        .map((item) => str(item))
        .join(first.slice("SEPARATOR=".length));
    }
    return items.map((item) => str(item)).join(" ");
  },

  "Convert To Integer": (item: RobotValue) => {
    const value = Number.parseInt(String(item), 10);
    if (Number.isNaN(value)) {
      throw new TypeError(`'${String(item)}' cannot be converted to an integer.`);
    }
    return value;
  },

  "Get Length": (item: RobotValue) => (item == null ? 0 : (item.length ?? Object.keys(item).length)),

  /** Only the formats the suite uses: "timestamp" and the default. */
  "Get Time": (...args: RobotValue[]) => {
    const { format } = argsOf(args, ["format"], { format: "timestamp" });
    const now = new Date();
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (String(format).includes("epoch")) {
      return Math.floor(now.getTime() / 1000);
    }
    return String(format) === "timestamp" ? `${date} ${time}` : `${date} ${time}`;
  },
});
