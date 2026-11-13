/** Keywords that the page objects share: clicks, waits and retries, text checks, and calendar times. */
import { test } from "@playwright/test";
import { appendFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import type { Locator } from "@playwright/test";
import { elementsOf } from "../../lib/locators";
import { errorMessage, expect, formatValue, rethrowSkip, step, log } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { python_keywords } from "../Resources/python_keywords";
import { BROWSER_TIMEOUT_GLOBAL, TEXT_CHECK_TIMEOUT } from "./variables";

/** The options of Check Elements Text and Check Element Contains Text */
interface CheckTextOptions {
  /** Trim the texts before comparing them (the check without return_status normalizes whitespace anyway) */
  strip_spaces?: boolean;
  ignore_case?: boolean;
  /** Check once and return whether the text matched, instead of waiting for it and failing */
  return_status?: boolean;
  message?: string | null;
}

/** A calendar time label for comparing: dashes as "-", without spaces. */
const normalizeTimeLabel = (text: string) => text.replaceAll(/[–—]/g, "-").replaceAll(" ", "");

export class CustomKeywords extends PageObject {
  /**
   * Clicks the first of the selector's elements that has exactly this text, waiting for it to appear. The text must be
   * in one element: text split over child elements doesn't match.
   */
  @step("custom_keywords.Find And Click Element With Text")
  async findAndClickElementWithText(element_with_text: string | Locator, wanted_text: string) {
    // text="…" matches an element that has a text node with exactly the text, also when the element has other text
    // too. getByText(…, { exact: true }) would need the element's whole text to be the text.
    const target = this.locate(element_with_text).locator(`text="${wanted_text}"`).first();
    // The click waits for the element to be visible and enabled
    await target.click();
  }

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

  @step("custom_keywords.Wait For Url To Contain")
  async waitForUrlToContain(url_part: string, timeout = 20_000) {
    // expect retries until the URL contains url_part
    await expect(this.page).toHaveURL((url) => url.href.includes(url_part), { timeout });
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

  /** Fails if one of the selector's elements has this text. */
  @step("custom_keywords.Verify Element With Text Is Not Found")
  async verifyElementWithTextIsNotFound(element_with_text: string | Locator, wanted_text: string) {
    // Reads the elements' texts (stripped, for WebKit) again until none of them is the text
    await expect
      .poll(async () => (await this.locate(element_with_text).allInnerTexts()).map((text) => text.trim()), {
        message: `No element has the text "${wanted_text}"`,
      })
      .not.toContain(wanted_text);
  }

  /** Verifies that the page has no element matching the selector. */
  @step("custom_keywords.Verify Element Is Not Found")
  async verifyElementIsNotFound(element_selector: string) {
    // Waits until the element is gone (expect's timeout)
    await expect(this.page.locator(element_selector), `The page has no ${element_selector}`).toHaveCount(0);
  }

  /** Verifies that the page has an element matching the selector. */
  @step("custom_keywords.Verify Element Is Found")
  async verifyElementIsFound(element_selector: string) {
    // Waits until the element is there (expect's timeout)
    await expect(this.page.locator(element_selector), `The page has ${element_selector}`).not.toHaveCount(0);
  }

  @step("custom_keywords.Find And Click Element With Exact Text Using JS")
  async findAndClickElementWithExactTextUsingJs(element_with_text: string | Locator, wanted_text: string) {
    const elements_with_text = await elementsOf(this.locate(element_with_text));

    for (const element of elements_with_text) {
      const el_text = await element.innerText();
      await log(`element is: ${formatValue(element)}`);
      await log(`Text found in element: ${el_text}`);

      if (el_text === wanted_text) {
        // A click event, like the DOM's click(): the element needn't be visible or in view
        await element.dispatchEvent("click");
        return;
      }
    }

    // Fail the test if no element was found
    throw new Error(`Element with text "${wanted_text}" not found`);
  }

  /** Finds an element containing the specified partial text and clicks it using JavaScript. */
  @step("custom_keywords.Find And Click Element With Partial Text Using JS")
  async findAndClickElementWithPartialTextUsingJs(element: string | Locator, partial_text: string) {
    // Get all matching elements based on the selector
    const elements = await elementsOf(this.locate(element));
    await log(`Found ${elements.length}`);

    // Loop through each element to find matching elements with the partial text
    for (const e of elements) {
      const text = await e.innerText();

      // Remove non-breaking spaces for accurate text comparison
      const clean_text = await this.removeNonBreakingSpace(text);

      // Log for troubleshooting
      await log(`Cleaned Text: ${clean_text}`);

      // Click if a match is found and immediately break the loop
      if (clean_text.includes(partial_text)) {
        // A click event, like the DOM's click(): the element needn't be visible or in view
        await e.dispatchEvent("click");
        // Set Variable    ${clicked}    True
        break;
      }
    }

    // Logged after a click too: nothing sets the flag of the commented-out line above
    await log(`No element with text '${partial_text}' was found to click.`);
  }

  /** Clicks `element_to_click` in the first `card_element` whose `text_element` has exactly the text `text`. */
  @step("custom_keywords.Find And Click Element In Card Element By Text")
  async findAndClickElementInCardElementByText(
    card_element: string,
    text_element: string,
    text: string,
    element_to_click: string
  ) {
    const cards = await elementsOf(this.page.locator(card_element));
    await log(`Found ${cards.length} card containers.`);

    for (const [index, card] of cards.entries()) {
      await log(`Checking card at index ${index}`);

      // Check if text element exists within the current card (a card is rendered whole)
      if ((await card.locator(text_element).count()) > 0) {
        const el_text = (await card.locator(text_element).innerText()).trim();
        await log(`Found text in card: ${el_text}`);

        if (el_text === text) {
          await log(`Found matching text '${text}' in card at index ${index}`);
          // Found the card with the desired text, now click the target element inside this card
          await card.locator(element_to_click).click();
          return;
        }
      }
    }

    throw new Error(`No card element found with text '${text}' in '${text_element}'`);
  }

  /**
   * In the first group that contains `group_text`, clicks the `button_text` button of the last card whose heading and
   * tags contain `heading_text` and `tags_text`.
   */
  @step("custom_keywords.Find And Click Button In Group With Matching Conditions")
  async findAndClickButtonInGroupWithMatchingConditions(
    group_wrapper_selector: string,
    group_text: string,
    card_selector: string,
    heading_selector: string,
    heading_text: string,
    tags_selector: string,
    tags_text: string,
    button_text: string
  ) {
    // Find all group wrappers
    const group_wrappers = await elementsOf(this.page.locator(group_wrapper_selector));
    await log(`Found ${group_wrappers.length} group wrappers.`);

    // Find the target group wrapper with specified text
    let target_group_wrapper: Locator | null = null;
    for (const wrapper of group_wrappers) {
      const wrapper_text = (await wrapper.innerText()).trim();
      await log(`Checking group wrapper text: ${wrapper_text}`);

      if (wrapper_text.includes(group_text)) {
        target_group_wrapper = wrapper;
        break;
      }
    }

    if (target_group_wrapper == null) {
      throw new Error(`No group wrapper found containing "${group_text}" text`);
    }

    // Find card elements within the target group wrapper and reverse to find last match efficiently
    const card_contents = await elementsOf(target_group_wrapper.locator(card_selector));
    await log(`Found ${card_contents.length} card elements in target group.`);

    // Reverse the list to find the last matching card with early termination
    card_contents.reverse();

    let matching_card: Locator | null = null;
    for (const card of card_contents) {
      if (await this.cardMatches(card, heading_selector, heading_text, tags_selector, tags_text)) {
        matching_card = card;
        await log("Found last matching card (first match in reversed list)");
        break;
      }
    }

    if (matching_card == null) {
      throw new Error(
        `No card found with matching conditions: heading contains '${heading_text}' and tags contain '${tags_text}'`
      );
    }

    // Click the button in the matching card
    await this.clickButtonInCard(matching_card, button_text);
  }

  /** Check if a card matches both heading and tags text criteria */
  @step("custom_keywords.Card Matches")
  async cardMatches(
    card: Locator,
    heading_selector: string,
    heading_text: string,
    tags_selector: string,
    tags_text: string
  ): Promise<boolean> {
    // Check heading text contains the expected text
    const heading_contains = await this.checkElementContainsText(card.locator(heading_selector), heading_text, {
      return_status: true,
    });
    if (!heading_contains) {
      return false;
    }

    // Check tags text contains the expected text
    return this.checkElementContainsText(card.locator(tags_selector), tags_text, { return_status: true });
  }

  /** Helper keyword to find and click a button with specific text in a card */
  @step("custom_keywords.Click Button In Card")
  async clickButtonInCard(card: Locator, button_text: string) {
    const buttons = await elementsOf(card.locator("button"));
    await log(`Found ${buttons.length} buttons in card`);

    for (const button of buttons) {
      if (await this.checkElementsText(button, button_text, { return_status: true })) {
        await button.click();
        return;
      }
    }

    throw new Error(`No "${button_text}" button found in card`);
  }

  /**
   * Checks that the applications list shows its empty state message. The user has no applications before the test,
   * which creates one and cancels it, so none should be left.
   */
  @step("custom_keywords.Verify Card Not Found In Group With Matching Conditions")
  async verifyCardNotFoundInGroupWithMatchingConditions(empty_state_message: string) {
    await log("Context: Test creates 1 application, cancels it, then verifies no applications remain", {
      level: "DEBUG",
    });

    // The empty state is a span with only the message, and expect retries until it shows
    await expect(
      this.page.locator("#main").getByText(empty_state_message, { exact: true }),
      `The page says "${empty_state_message}": no applications are left`
    ).toBeVisible();
  }

  @step("custom_keywords.Find Text From Elements Or Fail")
  async findTextFromElementsOrFail(element_with_text: string | Locator, wanted_text: string) {
    // Reads the elements' texts again until one of them is the wanted text (both stripped)
    await expect
      .poll(async () => (await this.locate(element_with_text).allInnerTexts()).map((text) => text.trim()), {
        message: `An element has the text "${wanted_text}"`,
      })
      .toContain(wanted_text.trim());
    await log(`Found element with text: "${wanted_text.trim()}."`, { level: "DEBUG" });
  }

  @step("custom_keywords.Find Text Element From Elements")
  async findTextElementFromElements(element_with_text: string | Locator, wanted_text: string): Promise<Locator | null> {
    const elements_with_text = await elementsOf(this.locate(element_with_text));
    const wanted = wanted_text.trim();

    for (const element of elements_with_text) {
      const el_text = (await element.innerText()).trim();
      await log(`Found text in element: ${el_text}`);

      if (el_text === wanted) {
        await log(`Found element with text "${wanted}."`);
        return element; // Return the matching element
      }
    }

    await log(`"Text '${wanted}' not found in any given elements."`);
    return null;
  }

  @step("custom_keywords.Remove Non-breaking Space")
  // oxlint-disable-next-line eslint/require-await -- keywords are async, each call is a report step
  async removeNonBreakingSpace(string: string) {
    return string.replaceAll(/\u00A0|\u200B|\u200C|\u200D|\u202F/g, " ").trim();
  }

  /** Verifies if a number extracted from the specified text element matches the expected value. */
  @step("custom_keywords.Check Number From Text Is Equal To")
  async checkNumberFromTextIsEqualTo(text_element: string | Locator, number_equalTo: string) {
    const number_element = this.locate(text_element);
    // Reads the element's digits again until they are the expected number
    await expect
      .poll(async () => (await number_element.innerText()).replaceAll(/[^0-9]/g, ""), {
        message: `The number in ${formatValue(text_element)} is ${number_equalTo}`,
      })
      .toBe(number_equalTo);
  }

  /** Verifies if a number extracted from the specified text element does NOT match the expected value. */
  @step("custom_keywords.Check Number From Text Is Not Equal To")
  async checkNumberFromTextIsNotEqualTo(text_element: string | Locator, number_notEqualTo: string) {
    await this.locate(text_element).waitFor({ state: "visible" });
    const number_element_string = await this.locate(text_element).innerText();
    await log(`Original text from element: ${number_element_string}`);
    const NUM_FROM_TXT = number_element_string.replaceAll(/[^0-9]/g, "");
    await log(`Extracted number: ${NUM_FROM_TXT}`);
    expect(NUM_FROM_TXT).not.toBe(number_notEqualTo);
    await log(`✓ Numbers are different: ${NUM_FROM_TXT} != ${number_notEqualTo}`);
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

  @step("custom_keywords.Check Elements Text With Remove Non-breaking Space")
  async checkElementsTextWithRemoveNonBreakingSpace(Element: string | Locator, Expected_text: string) {
    // expect waits until the text matches. It normalizes whitespace, non-breaking spaces included.
    await expect(this.locate(Element)).toHaveText(Expected_text, { useInnerText: true, timeout: 20_000 });
  }

  /**
   * Compares an element's text with the expected text, again without non-breaking spaces if it differs. If it still
   * does, writes the differences to a file in the test's output folder and fails.
   */
  @step("custom_keywords.Check Text Of Element With Normalization And Logging To File")
  async checkTextOfElementWithNormalizationAndLoggingToFile(Element: string | Locator, Expected_text: string) {
    // Wait until the element is visible on the page
    await this.locate(Element).waitFor({ state: "visible" });

    // Retrieve the text content of the element
    let Elements_text = await this.locate(Element).innerText();
    await log(`Retrieved text: ${Elements_text}`);

    // Initial text comparison
    let status = Elements_text === Expected_text ? "PASS" : "FAIL";
    let message = status === "PASS" ? null : `${Elements_text} != ${Expected_text}`;

    await log(`Initial comparison status: ${status}, message: ${message}`);

    // If texts match, stop execution here
    if (status === "PASS") {
      await log("Texts match. Test passes.");
      return;
    }

    // If texts do not match, perform normalization
    await log("Texts do not match. Attempting normalization.");

    // Normalize the actual elements text by removing non-breaking spaces
    Elements_text = await this.removeNonBreakingSpace(Elements_text);

    await log(`After normalization, actual text: ${Elements_text}, expected text: ${Expected_text}`);

    // Compare again after normalization
    status = Elements_text === Expected_text ? "PASS" : "FAIL";
    message = status === "PASS" ? null : `${Elements_text} != ${Expected_text}`;

    await log(`Comparison status after normalization: ${status}, message: ${message}`);

    // If texts match after normalization, stop execution here
    if (status === "PASS") {
      await log("Texts match after normalization. Test passes.");
      return;
    }

    // If texts still do not match, log the differences
    await log("Texts still do not match after normalization.");

    // Log differences using the Python function
    const differences = await python_keywords.log_differences(Elements_text, Expected_text);

    // Get the timestamp
    // "YYYY-MM-DD HH:MM:SS" in local time (the Swedish locale writes dates and times like that)
    const timestamp = new Date().toLocaleString("sv-SE");

    // Create the header
    const test_name = test.info().title;
    const header = `Test Name: ${test_name}
Timestamp: ${timestamp}
Differences:
`;

    // Format the differences
    const formatted_differences = differences
      .map(
        (diff) =>
          `Position: ${diff.position} | Elements Text: ${JSON.stringify(diff.elementsText)} | Expected Text: ${JSON.stringify(diff.expectedText)}`
      )
      .join("\n");

    // Write to a file in the test's output folder, named without the characters that a file name can't have
    const differences_file = test.info().outputPath(`debug_${test_name.replaceAll(/[\\/:*?"<>|]/g, "_")}.txt`);
    await appendFile(differences_file, `${header}${formatted_differences}`, "utf8");

    // Fail the test with a descriptive message
    throw new Error(`Texts still do not match after normalization. Differences logged to ${differences_file}.`);
  }

  /**
   * Checks an element's text, by default with the spaces stripped, retrying until it matches. With return_status it
   * checks once and returns true or false.
   */
  @step("custom_keywords.Check Elements Text")
  async checkElementsText(
    Element: string | Locator,
    Expected_text: string,
    { strip_spaces = true, ignore_case = false, return_status = false, message = null }: CheckTextOptions = {}
  ): Promise<boolean> {
    // Return status boolean for loops vs fail test for assertions
    if (return_status) {
      // Wait until the element is visible on the page
      await this.locate(Element).waitFor({ state: "visible", timeout: 10_000 });
      try {
        await this.elementTextShouldBe(Element, Expected_text, strip_spaces, ignore_case, message);
        return true;
      } catch {
        return false;
      }
    }
    // expect waits for the element and retries until its text matches, for TEXT_CHECK_TIMEOUT. It compares the text
    // with its whitespace normalized.
    await expect(this.locate(Element), message ?? undefined).toHaveText(Expected_text, {
      ignoreCase: ignore_case,
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
    return true;
  }

  @step("custom_keywords.Element Text Should Be")
  async elementTextShouldBe(
    element: string | Locator,
    expected_text: string,
    strip_spaces: boolean,
    ignore_case: boolean,
    message: string | null
  ) {
    let text = await this.locate(element).innerText();
    let expected = expected_text;
    if (strip_spaces) {
      text = text.trim();
      expected = expected.trim();
    }
    if (ignore_case) {
      text = text.toLowerCase();
      expected = expected.toLowerCase();
    }
    expect(text, message ?? undefined).toBe(expected);
  }

  /** Checks that the element's text contains the expected text. */
  @step("custom_keywords.Check Element Contains Text")
  async checkElementContainsText(
    Element: string | Locator,
    Expected_text: string,
    { strip_spaces = true, ignore_case = false, return_status = false }: Omit<CheckTextOptions, "message"> = {}
  ): Promise<boolean> {
    // Return status boolean for loops vs fail test for assertions
    if (return_status) {
      // Wait until the element is visible on the page
      await this.locate(Element).waitFor({ state: "visible", timeout: 10_000 });

      // Retrieve the text content of the element
      let haystack = await this.locate(Element).innerText();

      // Does the element text contain the expected text
      let needle = Expected_text;
      if (strip_spaces) {
        haystack = haystack.trim();
        needle = needle.trim();
      }
      if (ignore_case) {
        haystack = haystack.toLowerCase();
        needle = needle.toLowerCase();
      }
      return haystack.includes(needle);
    }
    // expect waits for the element and retries until its text contains the expected text. It compares the text with
    // its whitespace normalized.
    await expect(this.locate(Element)).toContainText(Expected_text, { ignoreCase: ignore_case, useInnerText: true });
    return true;
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
