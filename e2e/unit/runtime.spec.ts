/**
 * Offline unit tests of the suite's runtime: the keyword steps, the helpers in lib/, the test pages (Session) and the
 * keywords that don't need the test environment. They run against local pages, so they need no secrets or network.
 */
import { once } from "node:events";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { basename, dirname, join } from "node:path";
import { errors } from "@playwright/test";
import { mkdir, readdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { BackendErrors } from "../lib/backend-errors";
import { readEnv } from "../lib/env";
import { elementsOf, reachesState } from "../lib/locators";
import { SHARED_BASE, acquireLock, releaseLock, resetSharedState, sharedDir } from "../lib/locks";
import { graphqlErrorsIn } from "../lib/responses";
import { retry } from "../lib/retry";
import {
  errorMessage,
  expect,
  formatValue,
  redact,
  step,
  testWithoutBrowser as test,
  test as testWithBrowser,
} from "../lib/runtime";
import { Session } from "../lib/session";
import { Pages } from "../TestSuites/pages";
import { isConfirmedReservationUrl } from "../TestSuites/PO/Common/checkout";
import { python_keywords } from "../TestSuites/Resources/python_keywords";
import { BASIC_PERMISSION_TARGET_ADMIN, BASIC_USER_MALE } from "../TestSuites/Resources/serial_users";
import { COMBINED_UNITS, DESKTOP_UNITS } from "../TestSuites/Resources/suite_specific_units";
import { resolveTestData } from "../TestSuites/test-data";

const dataPage = (html: string) => `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

/** A keyword that fails, to see what `@step` does with the error. */
class FailingKeywords {
  @step("unittest.Fail With")
  failWith(error: Error): Promise<never> {
    return Promise.reject(error);
  }
}

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

/** The folder of a lock in this run's shared state. */
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

test.describe("Runtime", () => {
  test("Values are printed in step titles, with secrets hidden", () => {
    expect(formatValue({ page_id: "page=3", video_path: null, list: ["a", "it's", 1.5, false] })).toBe(
      `{"page_id":"page=3","video_path":null,"list":["a","it's",1.5,false]}`
    );
    expect(formatValue("text")).toBe("text");
    expect(formatValue(null)).toBe("null");
    expect(formatValue(20_000)).toBe("20000");
    // A secret stays hidden when it is printed inside an object, escaped or not
    const previous = { ROBOT_API_TOKEN: process.env.ROBOT_API_TOKEN };
    process.env.ROBOT_API_TOKEN = String.raw`to"k\en`;
    try {
      expect(redact(formatValue({ Authorization: process.env.ROBOT_API_TOKEN }))).toBe('{"Authorization":"***"}');
      expect(redact(`Token ${process.env.ROBOT_API_TOKEN}`)).toBe("Token ***");
    } finally {
      restoreEnv(previous);
    }
    // serial_users builds the full names from the first and last names
    expect(BASIC_USER_MALE.fullName).toBe("Ande AutomaatioTesteri");
    expect(BASIC_PERMISSION_TARGET_ADMIN.fullName).toBe("Marika Salminen");
  });

  test("Environment variables are read and checked in one place", () => {
    const previous = {
      FORCE_SINGLE_USER: process.env.FORCE_SINGLE_USER,
      WORKERS: process.env.WORKERS,
      LOG_LEVEL: process.env.LOG_LEVEL,
    };
    try {
      // Booleans like the frontend's coerceBoolean, in any case, so True works too
      process.env.FORCE_SINGLE_USER = "True";
      process.env.WORKERS = "3";
      expect(readEnv()).toMatchObject({ FORCE_SINGLE_USER: true, WORKERS: 3 });
      process.env.FORCE_SINGLE_USER = "0";
      expect(readEnv().FORCE_SINGLE_USER).toBe(false);
      // An invalid value fails with the variable's name, without the value
      process.env.LOG_LEVEL = "LOUD";
      let failure: unknown = null;
      try {
        readEnv();
      } catch (err) {
        failure = err;
      }
      expect(errorMessage(failure)).toContain("LOG_LEVEL");
      expect(errorMessage(failure)).not.toContain("LOUD");
    } finally {
      restoreEnv(previous);
    }
  });

  test("Errors and retries", async () => {
    // Playwright's timeouts keep their name in the message
    const timeout = new errors.TimeoutError("locator.waitFor: Timeout 20000ms exceeded.");
    expect(errorMessage(timeout)).toBe("TimeoutError: locator.waitFor: Timeout 20000ms exceeded.");
    expect(errorMessage(new Error("Element not found"))).toBe("Element not found");

    // retry(): an always failing action is tried the given number of times, and fails with its last error
    let attempts = 0;
    const alwaysFail = () => {
      attempts++;
      return Promise.reject(new Error(`nope ${attempts}`));
    };
    await expect(retry(3, 10, alwaysFail)).rejects.toThrow("nope 3");
    expect(attempts).toBe(3);
    expect(await retry(3, 10, () => Promise.resolve("first"))).toBe("first");
  });

  test("Secrets are hidden in the errors keywords fail with", async () => {
    const previous = { ROBOT_API_TOKEN: process.env.ROBOT_API_TOKEN };
    process.env.ROBOT_API_TOKEN = "unittest-secret";
    try {
      const keywords = new FailingKeywords();
      const failed = await failureOf(keywords.failWith(new Error("Token unittest-secret was rejected")));
      expect(failed).toBeInstanceOf(Error);
      expect((failed as Error).message).toBe("Token *** was rejected");
      expect((failed as Error).stack).not.toContain("unittest-secret");
      // Also in the errors it was caused by, and in errors whose message is read-only
      const caused = await failureOf(
        keywords.failWith(
          new Error("Request failed", { cause: new DOMException("Header unittest-secret", "AbortError") })
        )
      );
      expect(((caused as Error).cause as Error).message).toBe("Header ***");
    } finally {
      restoreEnv(previous);
    }
  });

  test("A keyword's error is reported at the line that called the keyword", async () => {
    const failure = new Error("Keyword failed");
    const marker = new Error("The keyword is called two lines below");
    try {
      await new FailingKeywords().failWith(failure);
    } catch {
      // The step that the error failed in is checked below
    }
    const callLine = Number(/runtime\.spec\.ts:(\d+):/.exec(marker.stack ?? "")?.[1]) + 2;
    // Playwright keeps the step that an error failed in on the error, under a private symbol. The report shows the
    // step at its stack's first frame and the error at its boxed stack's first frame. These are Playwright's
    // internals: if an upgrade changes them, check where a failing keyword shows in a report, then update this test.
    const failedStep = Object.getOwnPropertySymbols(failure)
      .map((symbol) => Reflect.get(failure, symbol) as { stack?: unknown[]; boxedStack?: unknown[] } | undefined)
      .find((step) => step?.boxedStack != null);
    const callerFrame = { file: expect.stringContaining("runtime.spec.ts"), line: callLine };
    expect(failedStep?.stack?.[0]).toMatchObject(callerFrame);
    expect(failedStep?.boxedStack?.[0]).toMatchObject(callerFrame);
  });

  test("Date and time keywords format like the Robot suite", async () => {
    const { dataModification, state } = new Pages();
    const [formatted, minusT] = await dataModification.setInfoCardDurationTimeInfo("11.30", "5.12.2023");
    expect(formatted).toBe("Ti 5.12.2023 klo 11:30–12:30, 1 t");
    expect(minusT).toBe("Ti 5.12.2023 klo 11:30–12:30");

    await dataModification.computeReservationTimeSlot("17:30", "60 min");
    expect(state.calendarTimeslot).toBe("17:30-18:30");
    await dataModification.computeReservationTimeSlot("09:45", "30 min");
    expect(state.calendarTimeslot).toBe("9:45-10:15");

    await dataModification.formatsReservationTimeToStartAndEndTime("Pe 1.11.2024 klo 11:00–12:00");
    expect(state.formattedStarttimeEmail).toBe("Alkamisaika: 1.11.2024 klo 11:00");
    expect(state.formattedEndtimeEmail).toBe("Päättymisaika: 1.11.2024 klo 12:00");

    await dataModification.convertFinnishShortDayToEnglish("Su 4.5.2025 klo 02:15–02:45, 30 min");
    expect(state.englishDay).toBe("Sunday");

    await dataModification.formatsTaglineForAdminSide("Ma 25.11.2024 klo 22:30–23:30, 1 t ", "Harakka,  piilokoju");
    expect(state.reservationTagline).toBe("Ma 25.11.2024 klo 22:30–23:30, 1 t | Harakka, piilokoju");

    // The dates the admin tests pick: d.M.yyyy without leading zeros, and dd.mm.yyyy with two digit hours
    expect(await dataModification.getDatePlus60Days()).toMatch(/^[1-9]\d?\.[1-9]\d?\.\d{4}$/);
    const [date, start_hour, end_hour] = await dataModification.getModifiedDateAndTime();
    expect(date).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    expect(start_hour).toMatch(/^\d{2}$/);
    expect(end_hour).toMatch(/^\d{2}$/);
    expect(await dataModification.generateRandomLetterAndNumber()).toMatch(/^[A-Za-z]\d$/);
  });

  test("Get Modified Date And Time gives a new day and hour on each call", async () => {
    const { dataModification } = new Pages();
    // 30 of its 75 days and hours, so some draws repeat an earlier one and are drawn again
    const times = new Set<string>();
    for (let call = 0; call < 30; call++) {
      // oxlint-disable-next-line no-await-in-loop -- each call has to see the days and hours of the calls before it
      const [date, start_hour] = await dataModification.getModifiedDateAndTime();
      times.add(`${date} ${start_hour}`);
    }
    expect(times.size).toBe(30);
  });

  test("Python keywords give the same results as python_keywords.py", () => {
    expect(python_keywords.convert_booking_time_to_ics("Ti 1.10.2024 klo 10:30–11:30")).toEqual([
      "DTSTART;TZID=Europe/Helsinki:20241001T103000",
      "DTEND;TZID=Europe/Helsinki:20241001T113000",
    ]);
    expect(python_keywords.validate_timeformat("Pe 13.9.2024 klo 11:45–12:45")).toBe(true);
    expect(python_keywords.validate_timeformat("Pe 13.9.2024 11:45")).toBe(false);
    expect(python_keywords.get_finnish_day(new Date(2023, 11, 5))).toBe("Ti");
    expect(python_keywords.format_date_to_ics("5.3.2026")).toBe("20260305");
  });

  test("The checkout is done when Varaamo opens the confirmed reservation", () => {
    const site = "https://varaamo.test.hel.ninja";
    // Where the payment success page waits (a rewrite of /callbacks/webstore/success, so the path stays /success),
    // where a cancelled or denied order goes, and where the success page gives up
    for (const path of [
      "/success?orderId=3f2b7c1e",
      "/callbacks/webstore/success?orderId=3f2b7c1e",
      "/reservations?error=order1",
      "/reservations/59472/?notify=polling_timeout",
      "/reservations/59472/cancel",
    ]) {
      expect(isConfirmedReservationUrl(new URL(path, site)), path).toBe(false);
    }
    // The reservation, as the success page opens it for each state, also under a language prefix
    for (const path of [
      "/reservations/59472/?notify=confirmed",
      "/reservations/59472/?notify=paid",
      "/reservations/59472/?notify=requires_handling",
      "/reservations/59472",
      "/en/reservations/59472/?notify=confirmed",
    ]) {
      expect(isConfirmedReservationUrl(new URL(path, site)), path).toBe(true);
    }
  });

  test("Tags choose the test data", () => {
    const parallel = { sequential: false };

    // A user test gets its users from its data set, and its units from its suite tag
    const user = resolveTestData(["desktop-suite", "desktop-test-data-set-0", "smoke"], parallel);
    expect(user.dataSet).toBe("desktop-test-data-set-0");
    expect(user.user.hetu).toMatch(/\S/);
    expect(user.units.alwaysFreeUnit).toBe(DESKTOP_UNITS.alwaysFreeUnit);
    expect(user.units.alwaysFreeUnitWithLocation).toBe(DESKTOP_UNITS.alwaysFreeUnitWithLocation);
    expect(user.admin.hetu).toBe("");
    // A unit that the suite doesn't pick fails when it is read
    expect(() => user.units.unitWithAccessCode).toThrow("The desktop-suite tests have no unit unitWithAccessCode");

    // A permission test gets the Django admin and the admin whose permissions change
    const permissions = resolveTestData(["admin-suite", "admin-test-data-set-2", "general-permissions-test"], parallel);
    expect(permissions.djangoAdmin.djangoUsername).toMatch(/\S/);
    expect(permissions.permissionTarget.hetu).toMatch(/\S/);
    expect(permissions.user.hetu).toBe("");
    expect(permissions.units.unavailableUnit).toBe(DESKTOP_UNITS.unavailableUnit);

    // A combined test gets both a user and an admin
    const combined = resolveTestData(["combined-suite", "combined-test-data-set-1"], parallel);
    expect(combined.user.fullName).toMatch(/\S/);
    expect(combined.admin.fullName).toMatch(/\S/);
    expect(combined.units.unitWithAccessCode).toBe(DESKTOP_UNITS.unitWithAccessCode);
    expect(combined.units.alwaysPaidUnitSubvented).toBe(COMBINED_UNITS.alwaysPaidUnitSubvented);

    // Sequential mode and tests without a data set use the shared users of serial_users
    const sequential = resolveTestData(["desktop-suite", "desktop-test-data-set-0"], { sequential: true });
    expect(sequential.dataSet).toBeNull();
    expect(sequential.user).toEqual(BASIC_USER_MALE);
    const unitPermissions = resolveTestData(["admin-suite", "admin-test-data-set-3", "unit-permissions-test"], {
      sequential: true,
    });
    expect(unitPermissions.permissionTarget.fullName).toBe("Niko Selänne");
    expect(resolveTestData([], parallel)).toMatchObject({ dataSet: null, suite: "desktop-suite" });

    // A data set that parallel_users.dat doesn't have fails the test instead of falling back to the shared users
    expect(() => resolveTestData(["desktop-test-data-set-99"], parallel)).toThrow(
      "No section with tags=desktop-test-data-set-99 in parallel_users.dat"
    );
  });

  test("Locks", async () => {
    await acquireLock("UNITTEST_LOCK");
    await releaseLock("UNITTEST_LOCK");
  });

  test("Locks can be taken again by their worker, and are taken over from a stopped one", async () => {
    await acquireLock("UNITTEST_REENTRANT");
    await acquireLock("UNITTEST_REENTRANT");
    await releaseLock("UNITTEST_REENTRANT");
    expect(existsSync(lockPath("UNITTEST_REENTRANT"))).toBe(true);
    await releaseLock("UNITTEST_REENTRANT");
    expect(existsSync(lockPath("UNITTEST_REENTRANT"))).toBe(false);
    await expect(releaseLock("UNITTEST_REENTRANT")).rejects.toThrow("Lock UNITTEST_REENTRANT isn't held by any worker");

    // A lock left by a stopped worker is taken over: its owner's process is gone, or it never got an owner file
    const noProcess = 2 ** 22 + 1; // above the largest process id of Linux and macOS
    await mkdir(lockPath("UNITTEST_STOPPED_OWNER"), { recursive: true });
    await writeFile(
      join(lockPath("UNITTEST_STOPPED_OWNER"), "owner.json"),
      JSON.stringify({ pid: noProcess, token: "x" })
    );
    await acquireLock("UNITTEST_STOPPED_OWNER");
    const owner = JSON.parse(await readFile(join(lockPath("UNITTEST_STOPPED_OWNER"), "owner.json"), "utf8")) as {
      pid: number;
    };
    expect(owner.pid).toBe(process.pid);
    await releaseLock("UNITTEST_STOPPED_OWNER");
    await mkdir(lockPath("UNITTEST_OWNERLESS"));
    const minuteAgo = new Date(Date.now() - 60_000);
    await utimes(lockPath("UNITTEST_OWNERLESS"), minuteAgo, minuteAgo);
    await acquireLock("UNITTEST_OWNERLESS");
    await releaseLock("UNITTEST_OWNERLESS");

    // A live worker's lock is waited for, and can't be released by another
    await mkdir(lockPath("UNITTEST_LIVE_OWNER"));
    await writeFile(
      join(lockPath("UNITTEST_LIVE_OWNER"), "owner.json"),
      JSON.stringify({ pid: process.ppid, token: "x" })
    );
    await expect(releaseLock("UNITTEST_LIVE_OWNER")).rejects.toThrow(
      "Lock UNITTEST_LIVE_OWNER is held by another worker"
    );
    const waiting = (async () => {
      await acquireLock("UNITTEST_LIVE_OWNER");
      return "taken";
    })();
    expect(await Promise.race([waiting, delay(500, "waiting")])).toBe("waiting");
    await rm(lockPath("UNITTEST_LIVE_OWNER"), { recursive: true });
    expect(await waiting).toBe("taken");
    await releaseLock("UNITTEST_LIVE_OWNER");
  });

  test("Each run keeps its locks in a folder of its own", async () => {
    const runDir = process.env.SHARED_STATE_RUN_DIR ?? "";
    expect(dirname(runDir)).toBe(SHARED_BASE);
    expect(basename(runDir)).toMatch(/^run-\d+-\d+$/);
    expect(sharedDir()).toBe(runDir);
    // The global setup of another run (like pnpm test:unit during a run) keeps this run's folder, removing old ones.
    // What isn't a run folder is kept.
    const old = join(SHARED_BASE, `run-${Date.now() - 2 * 24 * 60 * 60_000}-1`);
    const other = join(SHARED_BASE, "unittest-not-a-run");
    await mkdir(old);
    await mkdir(other, { recursive: true });
    try {
      await resetSharedState();
      expect(existsSync(runDir)).toBe(true);
      expect(existsSync(old)).toBe(false);
      expect(existsSync(other)).toBe(true);
      expect(process.env.SHARED_STATE_RUN_DIR).not.toBe(runDir);
    } finally {
      await rm(other, { recursive: true, force: true });
      const made = process.env.SHARED_STATE_RUN_DIR;
      if (made != null && made !== runDir && dirname(made) === SHARED_BASE) {
        await rm(made, { recursive: true, force: true });
      }
      process.env.SHARED_STATE_RUN_DIR = runDir;
    }
  });

  testWithBrowser(
    "Keywords read, wait and click with Playwright's locators",
    async ({ browser, context, page }, info) => {
      const session = new Session({ browser, context, page }, info);
      const { customKeywords } = new Pages(session);
      await session.openPage();
      await page.goto(
        dataPage(`
        <h1>Otsikko&nbsp;teksti</h1>
        <p id="number">Varausnumero 123</p>
        <ul id="list"><li><span>Yksi</span></li><li><span>Kaksi</span></li></ul>
        <button id="later" hidden>Myöhemmin</button>
        <div class="card"><b>Harakka</b><button onclick="this.textContent = 'Peruttu'">Peru</button></div>
        <script>setTimeout(() => document.getElementById("later").hidden = false, 300)</script>
      `)
      );
      expect(await customKeywords.removeNonBreakingSpace(await page.locator("h1").innerText())).toBe("Otsikko teksti");
      expect(await customKeywords.getNumberFromElementText("#number")).toBe("123");
      await customKeywords.checkElementsText("#list >> li >> nth=1", "Kaksi");
      expect(await customKeywords.checkElementsText("#list >> li >> nth=1", "Yksi", { return_status: true })).toBe(
        false
      );
      await customKeywords.findAndClickElementInCardElementByText(".card", "b", "Harakka", "button");
      await expect(page.locator(".card button")).toHaveText("Peruttu");

      // elementsOf waits for the first match, and gives an empty list when none appear in time
      expect(await elementsOf(page.locator("#list >> li"))).toHaveLength(2);
      expect(await elementsOf(page.locator(".missing"), 500)).toEqual([]);
      // reachesState waits, and answers instead of failing
      expect(await reachesState(page.locator("id=later"), "visible", 5000)).toBe(true);
      expect(await reachesState(page.locator(".missing"), "attached", 200)).toBe(false);
      // A locator prints as Playwright describes it in step titles and logs
      expect(formatValue(page.locator(".card").first())).toBe("locator('.card').first()");
      expect(formatValue(page.getByTestId("reservation__status"))).toBe("getByTestId('reservation__status')");
      await session.close();
    }
  );

  testWithBrowser("A GraphQL response's body is read for a limited time", async ({ browser, context, page }, info) => {
    // /hangs sends the headers but never ends the body, like a response from a page that is being reloaded.
    // The page comes from the same server: Chromium holds a fetch from a data: page to 127.0.0.1 for a local
    // network access permission that a headless browser never gets.
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(
          `<button id="hangs" onclick="fetch('/hangs')">Hae</button>` +
            `<button id="errors" onclick="fetch('/errors')">Virhe</button>`
        );
      } else if (request.url === "/hangs") {
        response.writeHead(200, { "content-type": "application/json" });
        response.write('{"data":');
      } else if (request.url === "/errors") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end('{"errors":[{"message":"nope"}]}');
      } else {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    try {
      const session = new Session({ browser, context, page }, info);
      await session.openPage();
      await page.goto(`http://127.0.0.1:${port}/`);
      const [hanging] = await Promise.all([
        page.waitForResponse((response) => response.url().includes("/hangs")),
        page.locator("id=hangs").click(),
      ]);
      const started = Date.now();
      expect(await graphqlErrorsIn(hanging, 1000)).toBe(false);
      expect(Date.now() - started).toBeLessThan(10_000);
      expect(info.annotations.some((annotation) => annotation.description?.includes("/hangs"))).toBe(true);
      const [failed] = await Promise.all([
        page.waitForResponse((response) => response.url().includes("/errors")),
        page.locator("id=errors").click(),
      ]);
      expect(await graphqlErrorsIn(failed, 1000)).toBe(true);
    } finally {
      server.closeAllConnections();
      server.close();
    }
  });

  testWithBrowser("Navigation and text helpers wait for the page", async ({ browser, context, page }, info) => {
    // The list and the URL change 300 ms late, like a page that is still rendering. The push button counts its clicks.
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`
          <button id="push" onclick="this.dataset.clicks = Number(this.dataset.clicks ?? 0) + 1;
            setTimeout(() => history.pushState({}, '', '/pushed'), 300)">Push</button>
          <a id="next" href="/next">Seuraava</a>
          <ul id="list"><li> Yksi </li><li class="leaving">Poistuva</li></ul>
          <script>
            setTimeout(() => {
              document.querySelector(".leaving").remove();
              document.getElementById("list").insertAdjacentHTML("beforeend", "<li> Kaksi </li>");
            }, 300);
          </script>
        `);
      } else if (request.url === "/next") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<p id="target" hidden>Perillä</p><script>setTimeout(() => target.hidden = false, 300)</script>`);
      } else {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    try {
      const session = new Session({ browser, context, page }, info);
      const { customKeywords } = new Pages(session);
      await session.openPage();
      await page.goto(`http://127.0.0.1:${port}/`);
      await customKeywords.findTextFromElementsOrFail("#list >> li", "Kaksi");
      await customKeywords.verifyElementWithTextIsNotFound("#list >> li", "Poistuva");
      // A client side navigation (history.pushState) after the click
      await customKeywords.clickAndWaitForPage("id=push");
      expect(page.url()).toBe(`http://127.0.0.1:${port}/pushed`);
      await customKeywords.waitForUrlToContain("/pushed", 5000);
      // A full navigation, whose target element shows up after the page has loaded
      await customKeywords.clickAndWaitForNavigationWithRetry("id=next", "id=target", 2, 5000);
      expect(page.url()).toBe(`http://127.0.0.1:${port}/next`);
      // A click that opened another page is not repeated, as the element to click was on the page it left
      await page.goto(`http://127.0.0.1:${port}/`);
      const started = Date.now();
      const left = await failureOf(customKeywords.clickAndWaitForNavigationWithRetry("id=next", "id=missing", 3, 1000));
      expect(errorMessage(left)).toContain("id=missing shows after the click");
      expect(Date.now() - started).toBeLessThan(5000);
      // A click that changed the URL but kept the element on the page is repeated
      await page.goto(`http://127.0.0.1:${port}/`);
      const kept = await failureOf(customKeywords.clickAndWaitForNavigationWithRetry("id=push", "id=missing", 2, 500));
      expect(errorMessage(kept)).toContain("id=missing shows after the click");
      await expect(page.locator("id=push")).toHaveAttribute("data-clicks", "2");
    } finally {
      server.closeAllConnections();
      server.close();
    }
  });

  testWithBrowser("Backend errors are recorded for the report", async ({ context, page }) => {
    // The server answers like a failing backend: a 500, GraphQL errors, a slow answer, the apps' 503 page (served
    // with status 200), a missing script, a blank page and a request that never answers, and the page throws an
    // uncaught error. A missing API path (404) isn't a backend error.
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<script src="/missing.js"></script><script>
          fetch("/not-found");
          fetch("/boom?token=unittest-query");
          fetch("/graphql/", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ operationName: "UnittestQuery", query: "{ x }" }),
          });
          fetch("/hangs");
          fetch("/slow");
          setTimeout(() => { throw new Error("unittest uncaught https://example.com/x?token=unittest-query"); }, 100);
        </script>`);
      } else if (request.url?.startsWith("/boom") === true) {
        response.writeHead(500).end();
      } else if (request.url === "/graphql/") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end('{"errors":[{"message":"unittest error"}]}');
      } else if (request.url === "/error-page") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end('<h1 data-testid="error__503--title">503: Palaamme pian!</h1>');
      } else if (request.url === "/blank") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end("<html><body></body></html>");
      } else if (request.url === "/slow") {
        setTimeout(() => response.writeHead(200).end("slow"), 300);
      } else if (request.url !== "/hangs") {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    // A failed test's info, so that the unanswered request is recorded too
    const info = {
      status: "failed" as const,
      expectedStatus: "passed" as const,
      annotations: [] as Array<{ type: string; description?: string }>,
    };
    const backendErrors = new BackendErrors(info, { watched: () => true, pendingMs: 0, slowMs: 200 });
    backendErrors.watch(context);
    try {
      const uncaught = page.waitForEvent("pageerror");
      await Promise.all([
        page.waitForResponse((response) => response.url().endsWith("/not-found")),
        page.waitForResponse((response) => response.url().includes("/boom")),
        page.waitForResponse((response) => response.url().endsWith("/graphql/")),
        page.waitForRequest((request) => request.url().endsWith("/hangs")),
        page.waitForEvent("requestfinished", (request) => request.url().endsWith("/slow")),
        page.goto(`http://127.0.0.1:${port}/`),
      ]);
      await uncaught;
      // Before the next page load cancels the request that has no answer
      backendErrors.notePending();
      await page.goto(`http://127.0.0.1:${port}/error-page`);
      // The failed test's open pages: one shows an error page, the other one nothing
      const blank_page = await context.newPage();
      await blank_page.goto(`http://127.0.0.1:${port}/blank`);
      await backendErrors.finish();
    } finally {
      server.closeAllConnections();
      server.close();
    }
    const recorded = info.annotations.map((annotation) => annotation.description ?? "");
    expect(info.annotations.every((annotation) => annotation.type === "backend error")).toBe(true);
    const host = `127.0.0.1:${port}`;
    for (const expected of [
      `500 Internal Server Error: GET ${host}/boom`,
      `404 Not Found: GET ${host}/missing.js`,
      `GraphQL errors: POST ${host}/graphql/ (UnittestQuery): unittest error`,
      `GET ${host}/hangs`,
      `GET ${host}/slow`,
      `error page "503" (status 200): GET ${host}/error-page`,
      `the page shows the error page "503": ${host}/error-page`,
      `the page is blank: ${host}/blank`,
      "uncaught error in the page at /: unittest uncaught https://example.com/x",
    ]) {
      expect(
        recorded.some((description) => description.endsWith(expected)),
        expected
      ).toBe(true);
    }
    expect(recorded.join("\n")).not.toContain("unittest-query");
    expect(recorded.join("\n")).not.toContain("/not-found");
  });

  testWithBrowser("Requests that a page load ends count only if they had waited", async ({ context, page }) => {
    // The page sends a request that never answers, another one 600 ms later, and then loads the next page, which ends
    // both. The browser doesn't always report such requests as failed, so they count by how long they had waited.
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<script>
          fetch("/waited");
          setTimeout(() => {
            fetch("/just-sent");
            location.href = "/next";
          }, 600);
        </script>`);
      } else if (request.url === "/next") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end("<p>next</p>");
      } else if (request.url !== "/waited" && request.url !== "/just-sent") {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    // A failed test's info, so that unanswered requests are recorded
    const info = {
      status: "failed" as const,
      expectedStatus: "passed" as const,
      annotations: [] as Array<{ type: string; description?: string }>,
    };
    const backendErrors = new BackendErrors(info, { watched: () => true, pendingMs: 300 });
    backendErrors.watch(context);
    try {
      const justSent = page.waitForRequest((request) => request.url().endsWith("/just-sent"));
      await page.goto(`http://127.0.0.1:${port}/`);
      await justSent;
      await expect(page.locator("p")).toHaveText("next");
      await backendErrors.finish();
    } finally {
      server.closeAllConnections();
      server.close();
    }
    const recorded = info.annotations.map((annotation) => annotation.description ?? "").join("\n");
    expect(recorded).toContain(`then the page was reloaded or left: GET 127.0.0.1:${port}/waited`);
    expect(recorded).not.toContain("/just-sent");
  });

  testWithBrowser(
    "The session opens the test's own page first, then contexts of their own",
    async ({ browser, context, page }, info) => {
      // The server echoes a header, like the WAF bypass header that devices.ts adds to every context
      const server = createServer((request, response) => {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<p>${String(request.headers["x-unittest-header"])}</p>`);
      });
      await once(server.listen(0, "127.0.0.1"), "listening");
      const { port } = server.address() as AddressInfo;
      const headers = { extraHTTPHeaders: { "X-Unittest-Header": "header" } };
      const session = new Session({ browser, context, page }, info);
      try {
        // The first one is Playwright's page, made with the project's `use` options
        expect(await session.openPage({ contextOptions: headers })).toBe(page);
        await session.page.goto(`http://127.0.0.1:${port}/`);
        await expect(session.page.locator("p")).toHaveText("header");

        // A later one is a new context, in the same browser or in another one
        const second = await session.openPage({ contextOptions: headers });
        expect(second.context()).not.toBe(page.context());
        expect(session.page).toBe(second);
        await second.goto(`http://127.0.0.1:${port}/`);
        await expect(second.locator("p")).toHaveText("header");
        const firefoxPage = await session.openPage({ browserName: "firefox" });
        expect(firefoxPage.context().browser()?.browserType().name()).toBe("firefox");

        // A new tab, and switching between pages
        const tab = await session.newPage();
        expect(tab.context()).toBe(firefoxPage.context());
        await session.switchTo(page);
        expect(session.page).toBe(page);
        await session.switchTo(session.latestPage());
        expect(session.page).toBe(page);

        // Closing closes what the session opened. Playwright closes its own page after the test.
        await session.close();
        expect(page.isClosed()).toBe(false);
        expect(second.isClosed()).toBe(true);
        expect(firefoxPage.isClosed()).toBe(true);
      } finally {
        await session.close();
        server.closeAllConnections();
        server.close();
      }
    }
  );

  testWithBrowser("HAR files are saved and hide secrets like the logs", async ({ browser, context, page }, info) => {
    // The server echoes the header back, so the secret is in a request header and in a response body
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(`<p>${String(request.headers["x-unittest-secret"])}</p>`);
      } else {
        response.writeHead(404).end();
      }
    });
    await once(server.listen(0, "127.0.0.1"), "listening");
    const { port } = server.address() as AddressInfo;
    const previous = {
      WAF_BYPASS_SECRET: process.env.WAF_BYPASS_SECRET,
      ENABLE_HAR_RECORDING: process.env.ENABLE_HAR_RECORDING,
    };
    process.env.WAF_BYPASS_SECRET = "unittest-har-secret";
    // With ENABLE_HAR_RECORDING=True every context the session opens records a HAR file into the test's results
    process.env.ENABLE_HAR_RECORDING = "True";
    const session = new Session({ browser, context, page }, info);
    try {
      await session.openPage();
      const recorded = await session.openPage({
        contextOptions: { extraHTTPHeaders: { "X-Unittest-Secret": "unittest-har-secret" } },
      });
      await recorded.goto(`http://127.0.0.1:${port}/`);
      await expect(recorded.locator("p")).toHaveText("unittest-har-secret");
      await session.close();
    } finally {
      await session.close();
      restoreEnv(previous);
      server.closeAllConnections();
      server.close();
    }
    const files = (await readdir(info.outputDir)).filter((name) => /^context-\d+\.har$/.test(name));
    expect(files).toHaveLength(1);
    const text = await readFile(info.outputPath(files[0] ?? ""), "utf8");
    expect(text).not.toContain("unittest-har-secret");
    const har = JSON.parse(text) as {
      log: { entries: Array<{ request: { url: string; headers: Array<{ name: string; value: string }> } }> };
    };
    const entry = har.log.entries.find((candidate) => candidate.request.url === `http://127.0.0.1:${port}/`);
    const header = entry?.request.headers.find((candidate) => candidate.name.toLowerCase() === "x-unittest-secret");
    expect(header?.value).toBe("***");
    expect(text).toContain("<p>***</p>");
  });
});
