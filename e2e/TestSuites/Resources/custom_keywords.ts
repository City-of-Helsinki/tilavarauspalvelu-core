/** Keywords that the page objects share: clicks, waits and retries, and calendar times. */
import { setTimeout } from "node:timers/promises";
import type { Locator } from "@playwright/test";
import { errorMessage, expect, formatValue, rethrowSkip, step, log } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { python_keywords } from "../Resources/python_keywords";
import { BROWSER_TIMEOUT_GLOBAL } from "./variables";

/** A calendar time label for comparing: dashes as "-", without spaces. */
const normalizeTimeLabel = (text: string) => text.replaceAll(/[–—]/g, "-").replaceAll(" ", "");

export class CustomKeywords extends PageObject {
  /**
   * Clicks an element and waits for a target element of the next page, clicking again if the target doesn't show. A
   * click that left the page isn't repeated, as the element was on the old page: the keyword fails at once, and the
   * caller can recover, e.g. by opening the first page again.
   */
  @step("custom_keywords.Click And Wait For Navigation With Retry")
  async clickAndWaitForNavigationWithRetry(
    click_selector: string | Locator,
    target_element_selector: string | Locator,
    max_attempts = 2,
    nav_timeout = 10_000
  ) {
    // Get URL before click to detect if navigation happened
    const url_before = this.page.url();

    // A click whose target element doesn't show is repeated after 2 s, at most max_attempts clicks in all
    for (let attempt = 1; ; attempt++) {
      await log(`Attempt ${attempt} of ${max_attempts}: Clicking ${formatValue(click_selector)}`, { level: "DEBUG" });
      try {
        // The click scrolls the element into view and waits until it's stable and enabled
        await this.locate(click_selector).focus();
        await this.locate(click_selector).click();

        // Wait for target element to appear (indicates successful navigation)
        await expect(
          this.locate(target_element_selector),
          `${formatValue(target_element_selector)} shows after the click`
        ).toBeVisible({ timeout: nav_timeout });
        await log(`✅ Successfully navigated on attempt ${attempt}`, { level: "DEBUG" });
        return;
      } catch (err) {
        // The click or its target element failed: log whether the page changed, then retry if there are attempts left
        const url_after = this.page.url();
        await log(
          url_after === url_before
            ? `⚠️ Navigation did not occur on attempt ${attempt}, URL unchanged`
            : `⚠️ URL changed to ${url_after} but target element not found`
        );
        if (attempt >= max_attempts) {
          throw err;
        }
        if (url_after !== url_before && (await this.locate(click_selector).count()) === 0) {
          await log("The clicked element is not on this page, so the click is not repeated");
          throw err;
        }
        await log("Waiting before retry...");
      }
      await setTimeout(2000);
    }
  }

  /**
   * Clicks an element and waits until the URL has changed, or contains `url_part` when given. The keywords that use the
   * new page wait for its content.
   */
  @step("custom_keywords.Click And Wait For Page")
  async clickAndWaitForPage(click_selector: string | Locator, url_part = "", timeout = BROWSER_TIMEOUT_GLOBAL) {
    const url_before = this.page.url();
    await this.locate(click_selector).click();
    // waitForURL waits for the new URL and then for the page to load. After a client-side navigation the page has
    // loaded already.
    await this.page.waitForURL((url) => (url_part !== "" ? url.href.includes(url_part) : url.href !== url_before), {
      timeout,
      waitUntil: "load",
    });
  }

  /** An HDS Select ignores a close within 200 ms of opening, so its list can stay open after the pick. */
  @step("custom_keywords.Close Select List If Open")
  async closeSelectListIfOpen(main_button: string | Locator) {
    // Retried every 300 ms until the list is closed
    await expect(async () => {
      await this.selectListShouldBeClosed(main_button);
    }).toPass({ intervals: [300], timeout: 5000 });
  }

  @step("custom_keywords.Select List Should Be Closed")
  async selectListShouldBeClosed(main_button: string | Locator) {
    let expanded = await this.locate(main_button).getAttribute("aria-expanded");
    if (expanded === "true") {
      await this.locate(main_button).click();
      expanded = await this.locate(main_button).getAttribute("aria-expanded");
    }
    expect(expanded, "The select list is closed").not.toEqual("true");
  }

  /**
   * Runs a keyword and, between failed attempts, a recovery keyword (for example Reload).
   * Fails with the error of the last attempt. Use only for steps that are safe to repeat.
   */
  @step("custom_keywords.Retry With Recovery")
  async retryWithRecovery(keyword: () => Promise<unknown>, recovery: () => Promise<unknown>, attempts = 3) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await keyword();
        return;
      } catch (err) {
        rethrowSkip(err);
        await log(`Attempt ${attempt}/${attempts} failed: ${errorMessage(err)}`, { level: "WARN" });
        if (attempt === attempts) {
          throw err;
        }
        await recovery();
      }
    }
  }

  /** Returns the digits of an element's text, or an empty string if it has none. */
  @step("custom_keywords.Get Number From Element Text")
  async getNumberFromElementText(text_element: string | Locator) {
    const element_text = await this.locate(text_element).innerText();
    await log(`Original text: ${element_text}`, { level: "DEBUG" });
    const numbers_only = element_text.replaceAll(/[^0-9]/g, "");
    await log(`Extracted numbers: ${numbers_only}`, { level: "DEBUG" });
    return numbers_only;
  }

  // Calendar extraction
  /** Converts a booking time string to ICS format with time zone information. */
  @step("custom_keywords.Convert Booking Time To ICS Format")
  async convertBookingTimeToIcsFormat(time_string: string) {
    // Check System Time Zone
    const timezone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    await log(`Current system time zone is: ${timezone}`, { level: "DEBUG" });

    // Convert booking time to ICS format using the Python function
    const [ics_start, ics_end] = python_keywords.convert_booking_time_to_ics(time_string);
    await log(`ICS Start Time: ${ics_start}`);
    await log(`ICS End Time: ${ics_end}`);
    this.state.formattedStartToIcs = ics_start;
    this.state.formattedEndToIcs = ics_end;
  }

  @step("custom_keywords.Extract Start And End Time From ICS File")
  async extractStartAndEndTimeFromIcsFile(text_from_ics_file: string) {
    // For testing
    // ${text_from_ics_file}=  Set Variable  asdfasfasdf_DTSTART;TZID=America/New_York:20241003T083000..werwer_DTEND;TZID=America/New_York:20241003T093000

    // Targets the event-specific DTSTART and DTEND lines with TZID.
    const dtstart_pattern = /DTSTART;TZID=Europe\/Helsinki:[0-9]{8}T[0-9]{6}/;
    const dtend_pattern = /DTEND;TZID=Europe\/Helsinki:[0-9]{8}T[0-9]{6}/;

    // Find the first matches in the ICS text
    const start_match = dtstart_pattern.exec(text_from_ics_file)?.[0];
    const end_match = dtend_pattern.exec(text_from_ics_file)?.[0];

    // Check if matches are found and directly use the first match for DTSTART and DTEND
    if (start_match == null) {
      throw new Error("No DTSTART matches found in the text");
    }
    if (end_match == null) {
      throw new Error("No DTEND matches found in the text");
    }

    await log(`Start match: ${start_match} and End match: ${end_match}`);

    // Save the extracted matches for the next keywords (state)
    this.state.startTimeFromIcs = start_match;
    this.state.endTimeFromIcs = end_match;
  }

  /** Checks that the weekday's column in the calendar has an event labelled exactly with this time. */
  @step("custom_keywords.Verify Reservation Slot Exists")
  async verifyReservationSlotExists(TIME_TO_CHECK: string, DAY_TO_CHECK: string) {
    // normalize search key
    const normTime = normalizeTimeLabel(TIME_TO_CHECK);
    await log(`Normalized search ➔ ${normTime}`, { level: "DEBUG" });

    // pick correct column index
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayIdx = days.indexOf(DAY_TO_CHECK);
    expect(dayIdx, `"${DAY_TO_CHECK}" is a day of the week`).toBeGreaterThanOrEqual(0);
    await log(`Checking column index ${dayIdx + 2}`, { level: "DEBUG" });

    // The time's label with any dash and spaces: "9:00-10:00" matches "9:00–10:00" and "9:00 – 10:00"
    const [start = "", end = ""] = normTime.split("-");
    const time_label = new RegExp(`^\\s*${start}\\s*[-–—]\\s*${end}\\s*$`);
    const slot_label = this.page
      .locator(`.rbc-time-column:nth-child(${dayIdx + 2}) .rbc-events-container .rbc-event-label`)
      .filter({ hasText: time_label });
    // The calendar's events are loaded after the page, so the label is waited for as long as an action waits
    await expect(
      slot_label.first(),
      `The calendar has a reservation on ${DAY_TO_CHECK} at ${TIME_TO_CHECK}`
    ).toBeAttached({ timeout: BROWSER_TIMEOUT_GLOBAL });

    // Calendar extraction
  }
}
