/** A resource file with keywords. */
import { test } from "@playwright/test";
import { appendFile } from "node:fs/promises";
import type { Locator } from "@playwright/test";
import { elementsOf } from "../../lib/locators";
import { errorMessage, expect, formatValue, rethrowSkip, step, log } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { python_keywords } from "../Resources/python_keywords";
import { BROWSER_TIMEOUT_GLOBAL, CONTENT_WAIT_TIMEOUT } from "./variables";

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
   * This keyword clicks the first element with exactly the specified text among the elements identified by the given selector.
   * It waits for such an element to appear, so slowly rendered lists are waited for.
   * The text has to be inside one element, text split over several child elements is not matched.
   */
  @step("custom_keywords.Find And Click Element With Text")
  async findAndClickElementWithText(element_with_text: string | Locator, wanted_text: string) {
    // text="…" matches an element that has a text node with exactly the text, also when the element has other text
    // too. getByText(…, { exact: true }) would need the element's whole text to be the text.
    const target = this.locate(element_with_text).locator(`text="${wanted_text}"`).first();
    // Port: Click waits for the element to be visible and enabled (Playwright's auto-waiting), so there's no
    // separate Wait For Elements State
    await target.click();
  }

  /**
   * Clicks an element and waits for navigation to complete with retry logic.
   * Handles flaky navigation by retrying click if target element doesn't appear.
   * Verifies navigation by checking for a target element on the destination page.
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

    for (let attempt = 1; attempt <= max_attempts; attempt++) {
      await log(`Attempt ${attempt} of ${max_attempts}: Clicking ${formatValue(click_selector)}`);

      // Port: the click scrolls the element into view and waits until it's stable and enabled (Playwright's
      // auto-waiting), so there's no Scroll To Element and Wait For Elements State before it
      await this.locate(click_selector).focus();
      await this.locate(click_selector).click();

      // Wait for target element to appear (indicates successful navigation)
      // Port: expect waits for it, instead of Run Keyword And Return Status around Wait For Elements State
      const target_exists = await expect(this.locate(target_element_selector))
        .toBeVisible({ timeout: nav_timeout })
        .then(
          () => true,
          () => false
        );

      if (target_exists) {
        await log(`✅ Successfully navigated on attempt ${attempt}`);
        return;
      }

      // Target element not found - check if we should retry
      const url_after = this.page.url();
      if (url_after === url_before) {
        await log(`⚠️ Navigation did not occur on attempt ${attempt}, URL unchanged`);
      } else {
        await log(`⚠️ URL changed to ${url_after} but target element not found`);
      }

      // Retry if we have more attempts
      if (attempt < max_attempts) {
        await log("Waiting before retry...");
        await this.page.waitForTimeout(2000);
      }
    }

    throw new Error(
      `ERROR: Failed to navigate after ${max_attempts} attempts. Target element '${formatValue(target_element_selector)}' not found. Check screenshot.`
    );
  }

  /**
   * Clicks an element and waits until the URL has changed, or contains ${url_part} when given.
   * Content of the new page is waited for by the keywords that use it.
   */
  @step("custom_keywords.Click And Wait For Page")
  async clickAndWaitForPage(click_selector: string | Locator, url_part = "", timeout = BROWSER_TIMEOUT_GLOBAL) {
    const url_before = this.page.url();
    await this.locate(click_selector).click();
    // Port: waitForURL waits for the new URL and then for the page to load, instead of Wait Until Keyword Succeeds
    // with Url Should Have Changed and Wait For Load State. After a client side navigation the page has loaded already.
    await this.page.waitForURL((url) => (url_part !== "" ? url.href.includes(url_part) : url.href !== url_before), {
      timeout,
      waitUntil: "load",
    });
  }

  @step("custom_keywords.Wait For Url To Contain")
  async waitForUrlToContain(url_part: string, timeout = 20_000) {
    // Port: expect retries until the URL contains url_part, instead of Wait Until Keyword Succeeds with Url Should
    // Have Changed
    await expect(this.page).toHaveURL((url) => url.href.includes(url_part), { timeout });
  }

  /** An HDS Select ignores a close within 200 ms of opening, so its list can stay open after the pick. */
  @step("custom_keywords.Close Select List If Open")
  async closeSelectListIfOpen(main_button: string | Locator) {
    // Port: expect(...).toPass retries every 300 ms, instead of Wait Until Keyword Succeeds
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
    expect(expanded, "The select list did not close").not.toEqual("true");
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

  /** This keyword verifies that an element containing the specified text is NOT found within a list of elements identified by the given selector. */
  @step("custom_keywords.Verify Element With Text Is Not Found")
  async verifyElementWithTextIsNotFound(element_with_text: string | Locator, wanted_text: string) {
    // Port: expect.poll reads the elements' texts (stripped, for webkit) again until none of them is the text,
    // instead of reading them once in a loop
    await expect
      .poll(async () => (await this.locate(element_with_text).allInnerTexts()).map((text) => text.trim()), {
        message: `Element with text "${wanted_text}" was found but should not be present`,
      })
      .not.toContain(wanted_text);
  }

  /** This keyword verifies that an element identified by the given selector is NOT found on the page. */
  @step("custom_keywords.Verify Element Is Not Found")
  async verifyElementIsNotFound(element_selector: string) {
    // Port: waits until the element is gone (expect's timeout) instead of counting the elements once
    await expect(
      this.page.locator(element_selector),
      `Element "${element_selector}" was found but should not be present`
    ).toHaveCount(0);
  }

  /** This keyword verifies that an element identified by the given selector IS found on the page. */
  @step("custom_keywords.Verify Element Is Found")
  async verifyElementIsFound(element_selector: string) {
    // Port: waits until the element is there (expect's timeout) instead of counting the elements once
    await expect(
      this.page.locator(element_selector),
      `Element "${element_selector}" was not found but should be present`
    ).not.toHaveCount(0);
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

    // Port: the Robot keyword never set ${clicked} (the line above is commented out there), so it always logged this
    await log(`No element with text '${partial_text}' was found to click.`);
  }

  /**
   * For each element matching ${card_element}, checks if it contains a child
   * ${text_element} with text ${text}. If so, clicks ${element_to_click} inside that card.
   */
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
   * Finds a group wrapper containing specified text, then searches for card elements
   * within that group. For each card, checks if the heading and tags elements contain
   * specified text. If both conditions are met, clicks the specified button.
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
   * Verifies that a specific empty state message is displayed in the application.
   * 0. Before test runs: User data is set so there are NO other applications - everything is empty
   * 1. The test creates exactly 1 application
   * 2. The test then cancels that 1 application
   * 3. After cancellation, there should be NO other applications remaining
   * 4. An appropriate empty state message should be displayed
   */
  @step("custom_keywords.Verify Card Not Found In Group With Matching Conditions")
  async verifyCardNotFoundInGroupWithMatchingConditions(empty_state_message: string) {
    await log("Context: Test creates 1 application, cancels it, then verifies no applications remain");

    // Get all elements that could contain the message
    const message_selector = "#main >> span";
    const message_elements = await elementsOf(this.page.locator(message_selector));
    const element_count = message_elements.length;

    if (element_count === 0) {
      throw new Error(`No message elements found using selector: ${message_selector}`);
    }

    await log(`Found ${element_count} potential message element(s) to check`);

    // Check if any element contains the expected message
    for (const element_text of (await this.page.locator(message_selector).allInnerTexts()).map((text) => text.trim())) {
      // Check for exact match
      if (element_text === empty_state_message) {
        return;
      }
    }

    // If message not found, raise error (message should exist after cancellation)
    throw new Error(
      `Expected empty state message "${empty_state_message}" not found. This indicates applications still exist after cancellation, but none should remain.`
    );
  }

  @step("custom_keywords.Find Text From Elements Or Fail")
  async findTextFromElementsOrFail(element_with_text: string | Locator, wanted_text: string) {
    // Port: expect.poll reads the elements' texts again until one of them is the wanted text (both stripped),
    // instead of reading them once in a loop
    await expect
      .poll(async () => (await this.locate(element_with_text).allInnerTexts()).map((text) => text.trim()), {
        message: `"Text '${wanted_text}' not found in any given elements."`,
      })
      .toContain(wanted_text.trim());
    await log(`Found element with text: "${wanted_text.trim()}."`);
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
        message: `The number in ${formatValue(text_element)} is not ${number_equalTo}`,
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

  /**
   * Extracts only numeric characters from an element's text and returns the number.
   * Returns empty string if no numbers are found.
   */
  @step("custom_keywords.Get Number From Element Text")
  async getNumberFromElementText(text_element: string | Locator) {
    await this.locate(text_element).waitFor({ state: "visible" });
    const element_text = await this.locate(text_element).innerText();
    await log(`Original text: ${element_text}`);
    const numbers_only = element_text.replaceAll(/[^0-9]/g, "");
    await log(`Extracted numbers: ${numbers_only}`);
    return numbers_only;
  }

  @step("custom_keywords.Check Elements Text With Remove Non-breaking Space")
  async checkElementsTextWithRemoveNonBreakingSpace(Element: string | Locator, Expected_text: string) {
    // Port: expect waits until the text matches. It normalizes whitespace, non-breaking spaces included.
    await expect(this.locate(Element)).toHaveText(Expected_text, { useInnerText: true, timeout: 20_000 });
  }

  /**
   * Compares the text content of an element with the expected text
   * normalizes it, and logs differences if mismatched.
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

    // Write to file
    await appendFile(`debug_${test_name}.txt`, `${header}${formatted_differences}`, "utf8");

    // Fail the test with a descriptive message
    throw new Error(`Texts still do not match after normalization. Differences logged to debug_${test_name}.txt.`);
  }

  /**
   * Checks element text with automatic space stripping and flexible comparison options.
   * Retries until the text matches, so slowly rendered text is waited for.
   * With return_status the text is checked once and true or false is returned.
   */
  @step("custom_keywords.Check Elements Text")
  async checkElementsText(
    Element: string | Locator,
    Expected_text: string,
    { strip_spaces = true, ignore_case = false, return_status = false, message = null }: CheckTextOptions = {}
  ): Promise<boolean> {
    // Determine the error message to use
    const final_msg = message ?? `Element text does not match. Element: ${formatValue(Element)}`;

    // Return status boolean for loops vs fail test for assertions
    if (return_status) {
      // Wait until the element is visible on the page
      await this.locate(Element).waitFor({ state: "visible", timeout: 10_000 });
      try {
        await this.elementTextShouldBe(Element, Expected_text, strip_spaces, ignore_case, final_msg);
        return true;
      } catch {
        return false;
      }
    }
    // Port: expect waits for the element and retries until its text matches, instead of the visible wait (10 s) and
    // Wait Until Keyword Succeeds (CONTENT_WAIT_TIMEOUT). It compares the text with its whitespace normalized.
    await expect(this.locate(Element), final_msg).toHaveText(Expected_text, {
      ignoreCase: ignore_case,
      useInnerText: true,
      timeout: 10_000 + CONTENT_WAIT_TIMEOUT,
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

  /** Checks if element text contains expected text using Should Contain */
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
    // Port: expect waits for the element and retries until its text contains the expected text, instead of the
    // Sleep (1 s) and reading the text once. It compares the text with its whitespace normalized.
    await expect(
      this.locate(Element),
      `Element text does not contain expected text. Element: ${formatValue(Element)}`
    ).toContainText(Expected_text, { ignoreCase: ignore_case, useInnerText: true });
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
    await log(`Current system time zone is: ${timezone}`);

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

  /**
   * Checks that a given weekday's column in the calendar contains
   * an event label exactly matching the specified time.
   */
  @step("custom_keywords.Verify Reservation Slot Exists")
  async verifyReservationSlotExists(TIME_TO_CHECK: string, DAY_TO_CHECK: string) {
    // normalize search key
    const normTime = normalizeTimeLabel(TIME_TO_CHECK);
    await log(`Normalized search ➔ ${normTime}`);

    // pick correct column index
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayIdx = days.indexOf(DAY_TO_CHECK);
    expect(dayIdx, `Day "${DAY_TO_CHECK}" not found`).toBeGreaterThanOrEqual(0);
    await log(`Checking column index ${dayIdx + 2}`);

    const day_labels = this.page.locator(
      `.rbc-time-column:nth-child(${dayIdx + 2}) .rbc-events-container .rbc-event-label`
    );
    const labels = await elementsOf(day_labels);
    await log(`Found ${labels.length} label(s) on ${DAY_TO_CHECK}`);
    expect(labels.length, `No reservation labels found. There should be at least one ${DAY_TO_CHECK}`).toBeGreaterThan(
      0
    );

    // Port: a local flag, Set Test Variable in the Robot suite (nothing else reads it)
    let found = false;

    for (const txt of (await day_labels.allInnerTexts()).map((label) => normalizeTimeLabel(label))) {
      await log(`Normalized label ➔ ${txt}`);
      if (txt === normTime) {
        found = true;
        await log("Match found!");
        break;
      }
    }

    await log(`Final result: ${found}`);
    expect(found, `Reservation not found for ${DAY_TO_CHECK} at ${TIME_TO_CHECK}`).toBe(true);

    // Calendar extraction
  }
}
