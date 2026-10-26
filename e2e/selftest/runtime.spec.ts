/**
 * Offline self-test of the port's runtime: the library shims and the keywords that don't need the test
 * environment. Runs against local data: pages, so it needs no secrets or network.
 */
import { once } from "node:events";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { basename, dirname, join } from "node:path";
import { errors } from "@playwright/test";
import { mkdir, readdir, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { Browser, within } from "../lib/Browser";
import { BuiltIn } from "../lib/BuiltIn";
import { DateTime } from "../lib/DateTime";
import { PabotLib, SHARED_BASE, readValueSets, resetSharedState, sharedDir } from "../lib/PabotLib";
import {
  V,
  errorMessage,
  exceptionMatches,
  expect,
  formatValue,
  isTruthy,
  named,
  redact,
  resetVariables,
  robot,
  str,
  test,
  timeToMs,
} from "../lib/robot";
import type { RobotValue } from "../lib/robot";
import { custom_keywords } from "../TestSuites/Resources/custom_keywords";
import { data_modification } from "../TestSuites/Resources/data_modification";
import { parallel_test_data } from "../TestSuites/Resources/parallel_test_data";
import { python_keywords } from "../TestSuites/Resources/python_keywords";
import "../TestSuites/Resources/variables";
import "../TestSuites/Resources/serial_users";
import "../TestSuites/Resources/devices";

const page = (html: string) => `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

/** Puts back environment variables a test changed. */
function restoreEnv(previous: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(previous)) {
    if (value == null) {
      Reflect.deleteProperty(process.env, name);
    } else {
      process.env[name] = value;
    }
  }
}

/** The folder of a PabotLib lock in this run's shared state. */
const lockPath = (name: string) => join(sharedDir(), "locks", name);

/** The error a promise fails with, or null. */
async function failureOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  return null;
}

test.describe("Runtime self-test", () => {
  test("Robot values and time strings", () => {
    expect(timeToMs("1.5s")).toBe(1500);
    expect(timeToMs("500ms")).toBe(500);
    expect(timeToMs("2 min")).toBe(120_000);
    expect(timeToMs("17 hours 30 minutes")).toBe((17 * 60 + 30) * 60_000);
    expect(isTruthy("False")).toBe(false);
    expect(isTruthy("True")).toBe(true);
    expect(str(null)).toBe("None");
    expect(str(true)).toBe("True");
  });

  test(
    "Values are printed and tags sorted like in Robot",
    { tag: ["@b-tag", "@a_Tag", "@A-other", "@A_tag", "@combined-suite", "@access-code"] },
    () => {
      // Expected values from Python's repr() and robot.model.Tags in Robot Framework 7.3.2
      expect(str({ success: true, waited: 0 })).toBe("{'success': True, 'waited': 0}");
      expect(formatValue({ page_id: "page=3", video_path: null, list: ["a", "it's", 1.5, false] })).toBe(
        `{'page_id': 'page=3', 'video_path': None, 'list': ['a', "it's", 1.5, False]}`
      );
      expect(str(["--no-sandbox", 'say "hi"', "back\\slash", "line\nbreak"])).toBe(
        `['--no-sandbox', 'say "hi"', 'back\\\\slash', 'line\\nbreak']`
      );
      expect(str([])).toBe("[]");
      expect(str({})).toBe("{}");
      expect(robot.TEST_TAGS).toEqual(["A-other", "access-code", "a_Tag", "b-tag", "combined-suite"]);
      // A secret stays hidden when it is printed inside a dictionary, escaped or not
      const previous = process.env.ROBOT_API_TOKEN;
      process.env.ROBOT_API_TOKEN = String.raw`to'k\en`;
      try {
        // Python's repr() puts a string with a ' in double quotes: {'Authorization': "to'k\\en"}
        expect(redact(formatValue({ Authorization: process.env.ROBOT_API_TOKEN }))).toBe(`{'Authorization': "***"}`);
        expect(redact(JSON.stringify({ Authorization: process.env.ROBOT_API_TOKEN }))).toBe('{"Authorization":"***"}');
      } finally {
        if (previous == null) {
          delete process.env.ROBOT_API_TOKEN;
        } else {
          process.env.ROBOT_API_TOKEN = previous;
        }
      }
      // serial_users.robot builds the full names from the variables above them
      expect(V.BASIC_USER_MALE_FULLNAME).toBe("Ande AutomaatioTesteri");
      expect(V.BASIC_PERMISSION_TARGET_ADMIN_FULLNAME).toBe("Marika Salminen");
    }
  );

  test("Time strings are read like Robot's timestr_to_secs", async () => {
    // Expected values from robot.utils.timestr_to_secs in Robot Framework 7.3.2
    const times: Array<[string, number]> = [
      ["1 days", 86_400_000],
      ["7 days", 604_800_000],
      ["1 day 2 hours 3 minutes 4 seconds 5 milliseconds", 93_784_005],
      ["1d 2h 3m 4s 5ms", 93_784_005],
      ["2 weeks", 1_209_600_000],
      ["-1d", -86_400_000],
      ["-1d 2h", -93_600_000],
      ["01:30", 90_000],
      ["1:00:10.5", 3_610_500],
      ["-00:05", -5000],
      ["1.5", 1500],
      ["2 mins 3 secs", 123_000],
      ["4 msecs", 4],
      ["1 millis", 1],
      ["3000 us", 3],
      ["2000000 ns", 2],
    ];
    for (const [time, ms] of times) {
      expect(timeToMs(time), time).toBe(ms);
    }
    for (const time of ["1 day 1 days", "1 fortnight", "1h foo", "", "1ds", "1:2:3:4"]) {
      expect(() => timeToMs(time), time).toThrow("Invalid time string");
    }
    // data_modification.Get Modified Date And Time, which failed on "1 days" in the first test environment run
    const date = await DateTime["Add Time To Date"](
      "2026-10-21 12:45:37",
      "1 days",
      named({ result_format: "%d.%m.%Y" })
    );
    expect(date).toBe("22.10.2026");
  });

  test("Errors, retries, dates and overrides behave like in Robot", async () => {
    // EXCEPT    TimeoutError*    type=glob (checkout.robot): the Browser library's text, as in Robot run #416
    const timeout = new errors.TimeoutError("locator.waitFor: Timeout 20000ms exceeded.");
    expect(errorMessage(timeout)).toBe("TimeoutError: locator.waitFor: Timeout 20000ms exceeded.");
    expect(exceptionMatches(timeout, "TimeoutError*", "glob")).toBe(true);
    expect(exceptionMatches(new Error("Element not found"), "TimeoutError*", "glob")).toBe(false);
    expect(await BuiltIn["Run Keyword And Ignore Error"](() => Promise.reject(timeout))).toEqual([
      "FAIL",
      "TimeoutError: locator.waitFor: Timeout 20000ms exceeded.",
    ]);

    // Wait Until Keyword Succeeds: attempts of an always failing keyword, counted with Robot Framework 7.3.2
    let attempts = 0;
    const alwaysFail = () => {
      attempts++;
      return Promise.reject(new Error("nope"));
    };
    await BuiltIn["Run Keyword And Ignore Error"](BuiltIn["Wait Until Keyword Succeeds"], "1s", "300ms", alwaysFail);
    expect(attempts).toBe(5);
    attempts = 0;
    await BuiltIn["Run Keyword And Ignore Error"](BuiltIn["Wait Until Keyword Succeeds"], "3x", "10ms", alwaysFail);
    expect(attempts).toBe(3);

    // Add Time To Date across daylight saving changes, from Robot Framework 7.3.2 with TZ=Europe/Helsinki
    const dates: Array<[string, string, string, string]> = [
      ["2026-10-22", "60 days", "%d.%m.%Y", "21.12.2026"],
      ["2026-10-22 00:30:00", "5 days", "%d.%m.%Y", "27.10.2026"],
      ["2026-10-25 05:00:00", "-3 hours", "%H", "02"],
      ["2026-03-20 23:30:00", "10 days", "%d.%m.%Y", "30.03.2026"],
    ];
    for (const [date, time, format, expected] of dates) {
      expect(
        await DateTime["Add Time To Date"](date, time, named({ result_format: format })),
        `${date} + ${time}`
      ).toBe(expected);
    }

    // Only the variables Robot's runners set with --variable can come from the environment
    const previous = { BROWSER: process.env.BROWSER, FORCE_SINGLE_USER: process.env.FORCE_SINGLE_USER };
    process.env.BROWSER = "/usr/bin/open";
    process.env.FORCE_SINGLE_USER = "True";
    try {
      resetVariables();
      expect(V.BROWSER).toBe("chromium");
      expect(V.FORCE_SINGLE_USER).toBe("True");
    } finally {
      for (const [name, value] of Object.entries(previous)) {
        if (value == null) {
          Reflect.deleteProperty(process.env, name);
        } else {
          process.env[name] = value;
        }
      }
      resetVariables();
    }
  });

  test("Secrets are hidden in the errors keywords fail with", async () => {
    const previous = { ROBOT_API_TOKEN: process.env.ROBOT_API_TOKEN };
    process.env.ROBOT_API_TOKEN = "selftest-secret";
    try {
      const failed = await failureOf(BuiltIn["Fail"]("Token selftest-secret was rejected"));
      expect(failed).toBeInstanceOf(Error);
      expect((failed as Error).message).toBe("Token *** was rejected");
      expect((failed as Error).stack).not.toContain("selftest-secret");
      // Also in the errors it was caused by, and in errors whose message is read-only
      const caused = await failureOf(
        BuiltIn["Run Keyword"](() => {
          throw new Error("Request failed", { cause: new DOMException("Header selftest-secret", "AbortError") });
        })
      );
      expect(((caused as Error).cause as Error).message).toBe("Header ***");
      expect(await BuiltIn["Run Keyword And Ignore Error"](BuiltIn["Fail"], "selftest-secret")).toEqual([
        "FAIL",
        "***",
      ]);
    } finally {
      restoreEnv(previous);
    }
  });

  test("A wait with a time limit gives up like a keyword timeout", async () => {
    // Never settles, like a response body that doesn't finish
    const never = once(new EventTarget(), "never");
    const started = Date.now();
    expect(await within(never, 50, "expired")).toBe("expired");
    expect(Date.now() - started).toBeGreaterThanOrEqual(45);
    expect(await within(Promise.resolve("body"), 50, "expired")).toBe("body");
    // 0 means no limit, like Playwright's timeouts
    expect(await within(delay(80, "later"), 0, "expired")).toBe("later");
  });

  test("Date and time keywords format like the Robot suite", async () => {
    const [formatted, minusT] = await data_modification["Set Info Card Duration Time Info"]("11.30", "5.12.2023");
    expect(formatted).toBe("Ti 5.12.2023 klo 11:30–12:30, 1 t");
    expect(minusT).toBe("Ti 5.12.2023 klo 11:30–12:30");

    await data_modification["Compute Reservation Time Slot"]("17:30", "60 min");
    expect(V.CALENDAR_TIMESLOT).toBe("17:30-18:30");

    await data_modification["Formats Reservation Time To Start And End Time"]("Pe 1.11.2024 klo 11:00–12:00");
    expect(V.FORMATTED_STARTTIME_EMAIL).toBe("Alkamisaika: 1.11.2024 klo 11:00");
    expect(V.FORMATTED_ENDTIME_EMAIL).toBe("Päättymisaika: 1.11.2024 klo 12:00");

    await data_modification["Convert Finnish Short Day To English"]("Su 4.5.2025 klo 02:15–02:45, 30 min");
    expect(V.ENGLISH_DAY).toBe("Sunday");

    await data_modification["Formats Tagline For Admin Side"](
      "Ma 25.11.2024 klo 22:30–23:30, 1 t ",
      "Harakka,  piilokoju"
    );
    expect(V.RESERVATION_TAGLINE).toBe("Ma 25.11.2024 klo 22:30–23:30, 1 t | Harakka, piilokoju");
  });

  test("Python keywords give the same results as python_keywords.py", () => {
    expect(python_keywords.convert_booking_time_to_ics("Ti 1.10.2024 klo 10:30–11:30")).toEqual([
      "DTSTART;TZID=Europe/Helsinki:20241001T103000",
      "DTEND;TZID=Europe/Helsinki:20241001T113000",
    ]);
    expect(python_keywords.validate_timeformat("Pe 13.9.2024 klo 11:45–12:45")).toBe(true);
    expect(python_keywords.validate_timeformat("Pe 13.9.2024 11:45")).toBe(false);
    expect(python_keywords.get_finnish_day(new Date(2023, 11, 5))).toBe("Ti");
  });

  test("Tags are parsed like in parallel_test_data.robot", async () => {
    const parsed = await parallel_test_data["Parse Test Tags"]([
      "admin-suite",
      "admin-test-data-set-2",
      "general-permissions-test",
    ]);
    expect(parsed).toEqual(["admin-test-data-set-2", true, false, true, false, "general-permissions-test"]);
  });

  test("PabotLib locks, parallel values and value sets", async () => {
    await PabotLib["Acquire Lock"]("SELFTEST_LOCK");
    await PabotLib["Release Lock"]("SELFTEST_LOCK");
    expect(await PabotLib["Get Parallel Value For Key"]("SELFTEST_MISSING")).toBe("");
    await PabotLib["Set Parallel Value For Key"]("SELFTEST_KEY", "value");
    expect(await PabotLib["Get Parallel Value For Key"]("SELFTEST_KEY")).toBe("value");

    const set = readValueSets().find((candidate) => candidate.name === "desktop-test-data-set-0");
    expect(set).toBeDefined();
    await PabotLib["Acquire Value Set"]("desktop-test-data-set-0");
    expect(await PabotLib["Get Value From Set"]("CURRENT_USER_HETU")).toBe(set?.values.current_user_hetu);
    await PabotLib["Release Value Set"]();
  });

  test("PabotLib locks and value sets follow pabot's lock server", async () => {
    // Expected behaviour and errors from pabot 5.1.0's pabotlib.py and its remote server
    await PabotLib["Acquire Lock"]("SELFTEST_REENTRANT");
    await PabotLib["Acquire Lock"]("SELFTEST_REENTRANT");
    await PabotLib["Release Lock"]("SELFTEST_REENTRANT");
    expect(existsSync(lockPath("SELFTEST_REENTRANT"))).toBe(true);
    await PabotLib["Release Lock"]("SELFTEST_REENTRANT");
    expect(existsSync(lockPath("SELFTEST_REENTRANT"))).toBe(false);
    await expect(PabotLib["Release Lock"]("SELFTEST_REENTRANT")).rejects.toThrow(/^KeyError: 'SELFTEST_REENTRANT'$/);

    // A lock left by a stopped worker is taken over: its owner's process is gone, or it never got an owner file
    const noProcess = 2 ** 22 + 1; // above the largest process id of Linux and macOS
    await mkdir(lockPath("SELFTEST_STOPPED_OWNER"), { recursive: true });
    await writeFile(
      join(lockPath("SELFTEST_STOPPED_OWNER"), "owner.json"),
      JSON.stringify({ pid: noProcess, token: "x" })
    );
    await PabotLib["Acquire Lock"]("SELFTEST_STOPPED_OWNER");
    const owner = JSON.parse(await readFile(join(lockPath("SELFTEST_STOPPED_OWNER"), "owner.json"), "utf8"));
    expect(owner.pid).toBe(process.pid);
    await PabotLib["Release Lock"]("SELFTEST_STOPPED_OWNER");
    await mkdir(lockPath("SELFTEST_OWNERLESS"));
    const minuteAgo = new Date(Date.now() - 60_000);
    await utimes(lockPath("SELFTEST_OWNERLESS"), minuteAgo, minuteAgo);
    await PabotLib["Acquire Lock"]("SELFTEST_OWNERLESS");
    await PabotLib["Release Lock"]("SELFTEST_OWNERLESS");

    // A live worker's lock is waited for, and can't be released by another
    await mkdir(lockPath("SELFTEST_LIVE_OWNER"));
    await writeFile(
      join(lockPath("SELFTEST_LIVE_OWNER"), "owner.json"),
      JSON.stringify({ pid: process.ppid, token: "x" })
    );
    await expect(PabotLib["Release Lock"]("SELFTEST_LIVE_OWNER")).rejects.toThrow(/^AssertionError$/);
    const waiting = PabotLib["Acquire Lock"]("SELFTEST_LIVE_OWNER");
    expect(await within(waiting, 500, "waiting")).toBe("waiting");
    await rm(lockPath("SELFTEST_LIVE_OWNER"), { recursive: true });
    expect(await waiting).toBe(true);
    await PabotLib["Release Lock"]("SELFTEST_LIVE_OWNER");

    // Releasing without a value set does nothing; one value set at a time; keys are case-insensitive
    await PabotLib["Release Value Set"]();
    await PabotLib["Acquire Value Set"]("desktop-test-data-set-1");
    await expect(PabotLib["Acquire Value Set"]("desktop-test-data-set-2")).rejects.toThrow(
      /^ValueError: Caller has already reserved a value set\.$/
    );
    await expect(PabotLib["Acquire Value Set"]("no-such-tag")).rejects.toThrow(/^ValueError: Caller has/);
    expect(await PabotLib["Get Value From Set"]("current_user_hetu")).toBe(
      await PabotLib["Get Value From Set"]("CURRENT_USER_HETU")
    );
    await expect(PabotLib["Get Value From Set"]("NO_SUCH_KEY")).rejects.toThrow(/^No value for key "no_such_key"$/);
    await PabotLib["Release Value Set"]();
    await expect(PabotLib["Acquire Value Set"]("no-such-tag")).rejects.toThrow(
      /^ValueError: No value set matching given tags exists\.$/
    );
  });

  test("Each run keeps PabotLib's state in a folder of its own", async () => {
    const runDir = process.env.PABOT_SHARED_RUN_DIR ?? "";
    expect(dirname(runDir)).toBe(SHARED_BASE);
    expect(basename(runDir)).toMatch(/^run-\d+-\d+$/);
    expect(sharedDir()).toBe(runDir);
    // The global setup of another run (like pnpm selftest during a run) keeps this run's folder, removing old ones
    const old = join(SHARED_BASE, `run-${Date.now() - 2 * 24 * 60 * 60_000}-1`);
    await mkdir(old);
    try {
      await resetSharedState();
      expect(existsSync(runDir)).toBe(true);
      expect(existsSync(old)).toBe(false);
      expect(process.env.PABOT_SHARED_RUN_DIR).not.toBe(runDir);
    } finally {
      const made = process.env.PABOT_SHARED_RUN_DIR;
      if (made != null && made !== runDir && dirname(made) === SHARED_BASE) {
        await rm(made, { recursive: true, force: true });
      }
      process.env.PABOT_SHARED_RUN_DIR = runDir;
    }
  });

  test("Browser keywords keep the Browser library's semantics", async () => {
    await Browser["New Browser"]("chromium", true);
    await Browser["New Context"](named({ viewport: "{'width': 800, 'height': 600}", acceptDownloads: "True" }));
    await Browser["New Page"](
      page(`
        <h1>Otsikko teksti</h1>
        <input id="name" value="alku">
        <ul id="list"><li><span>Yksi</span></li><li><span>Kaksi</span></li></ul>
        <button id="later" hidden>Myöhemmin</button>
        <div class="card"><b>Harakka</b><button>Peru</button></div>
        <script>setTimeout(() => document.getElementById("later").hidden = false, 300)</script>
      `)
    );
    // Get Text: innerText for elements, the value for inputs
    expect(await Browser["Get Text"]("h1")).toBe("Otsikko teksti");
    expect(await custom_keywords["Remove Non-breaking Space"](await Browser["Get Text"]("h1"))).toBe("Otsikko teksti");
    expect(await Browser["Get Text"]("id=name")).toBe("alku");
    await Browser["Type Text"]("id=name", "uusi");
    expect(await Browser["Get Text"]("id=name")).toBe("uusi");

    // Waits and counts
    await Browser["Wait For Elements State"]("id=later", "visible", named({ timeout: "5s" }));
    expect(await Browser["Get Element Count"]("#list >> li")).toBe(2);
    await custom_keywords["Check Elements Text"]("#list >> li >> nth=1", "Kaksi");

    // Element references from Get Elements chain with >>
    const cards = await Browser["Get Elements"](".card");
    await custom_keywords["Find And Click Element In Card Element By Text"](".card", "b", "Harakka", "button");
    expect(cards).toHaveLength(1);
    // An element reference prints as its selector, like the Browser library's references
    expect(str(cards[0])).toBe(".card >> nth=0");
    // Switch Page fails on an unknown id, with the Browser library's message
    await expect(Browser["Switch Page"]("page=unknown")).rejects.toThrow(
      "No page with requested id 'page=unknown' found."
    );
    // No cookies is an empty list, whatever the return type
    expect(await Browser["Get Cookies"](named({ return_type: "string" }))).toEqual([]);
    await Browser["Set Browser Timeout"]("1s");
    expect(await Browser["Get Elements"](".missing")).toEqual([]);

    // Assertion operators retry like the Browser library
    expect(await Browser["Get Attribute"]("id=name", "id", "==", "name")).toBe("name");

    // Robot's failure semantics
    expect(await BuiltIn["Run Keyword And Return Status"](Browser["Get Text"], "h1", "==", "Väärä")).toBe(false);
    await Browser["Close Browser"]();
  });

  test("Wait For Response continues without a body that never finishes", async () => {
    // /hangs sends the headers but never ends the body, like a response from a page that is being reloaded.
    // The page comes from the same server: Chromium holds a fetch from a data: page to 127.0.0.1 for a local
    // network access permission that a headless browser never gets.
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<button onclick="fetch('/hangs')">Hae</button>`);
      } else if (request.url === "/hangs") {
        response.writeHead(200, { "content-type": "application/json" });
        response.write('{"data":');
      } else {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    try {
      await Browser["New Browser"]("chromium", true);
      await Browser["New Page"](`http://127.0.0.1:${port}/`);
      const loaded = await Browser["Promise To"](
        Browser["Wait For Response"],
        named({ matcher: (response: RobotValue) => response.url().includes("/hangs"), timeout: "1s" })
      );
      await Browser["Click"]("button");
      const started = Date.now();
      const response = await Browser["Wait For"](loaded);
      expect(response.ok).toBe(true);
      expect(response.body).toBeNull();
      expect(Date.now() - started).toBeLessThan(10_000);
      expect(test.info().annotations.some((annotation) => annotation.description?.includes("/hangs"))).toBe(true);
      await Browser["Close Browser"]();
    } finally {
      server.closeAllConnections();
      server.close();
    }
  });

  test("Closing a browser saves its HAR file and trace", async () => {
    // har_recording.robot passes recordHar to New Context; PW_TRACE=on adds a Playwright trace
    const har = test.info().outputPath("selftest.har");
    const previous = { PW_TRACE: process.env.PW_TRACE, CI: process.env.CI };
    process.env.PW_TRACE = "on";
    Reflect.deleteProperty(process.env, "CI");
    try {
      await Browser["New Browser"]("chromium", true);
      await Browser["New Context"](named({ recordHar: { path: har, omitContent: false } }));
      await Browser["New Page"](page("<h1>HAR</h1>"));
      await Browser["Close Browser"]();
      // In CI no trace is recorded
      process.env.CI = "true";
      await Browser["New Browser"]("chromium", true);
      await Browser["New Context"]();
      await Browser["New Page"](page("<h1>CI</h1>"));
      await Browser["Close Browser"]();
    } finally {
      restoreEnv(previous);
    }
    const recorded = JSON.parse(await readFile(har, "utf8")) as { log: { entries: unknown[] } };
    expect(Array.isArray(recorded.log.entries)).toBe(true);
    // The trace is saved in the test's results folder only, not attached to the report
    const traces = (await readdir(test.info().outputDir)).filter((name) => /^trace-.+\.zip$/.test(name));
    expect(traces).toHaveLength(1);
    expect((await stat(test.info().outputPath(traces[0] ?? ""))).size).toBeGreaterThan(0);
    expect(test.info().attachments.map((attachment) => attachment.name)).not.toContain("trace");
    expect(test.info().annotations).toContainEqual({ type: "warning", description: "PW_TRACE=on is ignored in CI" });
  });

  test("HAR files hide secrets like the logs", async () => {
    // The server echoes the header back, so the secret is in a request header and in a response body
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<p>${String(request.headers["x-selftest-secret"])}</p>`);
      } else {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    const har = test.info().outputPath("secret.har");
    const previous = { WAF_BYPASS_SECRET: process.env.WAF_BYPASS_SECRET };
    process.env.WAF_BYPASS_SECRET = "selftest-har-secret";
    try {
      await Browser["New Browser"]("chromium", true);
      await Browser["New Context"](
        named({
          extraHTTPHeaders: { "X-Selftest-Secret": "selftest-har-secret" },
          recordHar: { path: har, omitContent: false },
        })
      );
      await Browser["New Page"](`http://127.0.0.1:${port}/`);
      expect(await Browser["Get Text"]("p")).toBe("selftest-har-secret");
      await Browser["Close Browser"]();
    } finally {
      restoreEnv(previous);
      server.closeAllConnections();
      server.close();
    }
    const text = await readFile(har, "utf8");
    expect(text).not.toContain("selftest-har-secret");
    const recorded = JSON.parse(text) as {
      log: { entries: Array<{ request: { url: string; headers: Array<{ name: string; value: string }> } }> };
    };
    const entry = recorded.log.entries.find((candidate) => candidate.request.url === `http://127.0.0.1:${port}/`);
    const header = entry?.request.headers.find((candidate) => candidate.name.toLowerCase() === "x-selftest-secret");
    expect(header?.value).toBe("***");
    expect(text).toContain("<p>***</p>");
  });
});
