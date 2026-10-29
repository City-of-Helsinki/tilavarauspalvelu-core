import type { Locator } from "@playwright/test";
/** A resource file with keywords. */
import { Collections } from "../../lib/Collections";
import { elementsOf } from "../../lib/locators";
import { OperatingSystem } from "../../lib/OperatingSystem";
import {
  V,
  errorMessage,
  expect,
  isTruthy,
  namedOnly,
  rethrowSkip,
  robot,
  str,
  timeToMs,
  step,
  log,
} from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/variables";
import "../Resources/texts_FI";
import "../Resources/serial_users";
import { String_ } from "../../lib/String";
import { PageObject } from "../page-object";
import { python_keywords } from "../Resources/python_keywords";

/** A calendar time label for comparing: dashes as "-", without spaces. */
const normalizeTimeLabel = (text: string) => text.replaceAll(/[–—]/g, "-").replaceAll(" ", "");

export class CustomKeywords extends PageObject {
  /**
   * This keyword clicks the first element with exactly the specified text among the elements identified by the given selector.
   * It waits for such an element to appear, so slowly rendered lists are waited for.
   * The text has to be inside one element, text split over several child elements is not matched.
   */
  @step("custom_keywords.Find And Click Element With Text")
  async findAndClickElementWithText(element_with_text: string, wanted_text: RobotValue) {
    let target: Locator;
    // text="…" matches an element that has a text node with exactly the text, also when the element has other text
    // too. getByText(…, { exact: true }) would need the element's whole text to be the text.
    target = this.page
      .locator(element_with_text)
      .locator(`text="${str(wanted_text)}"`)
      .first();
    // Port: Click waits for the element to be visible and enabled (Playwright's auto-waiting), so there's no
    // separate Wait For Elements State
    await target.click();
    await log(`Element with text "${str(wanted_text)}" clicked.`);
  }

  /**
   * Clicks an element and waits for navigation to complete with retry logic.
   * Handles flaky navigation by retrying click if target element doesn't appear.
   * Verifies navigation by checking for a target element on the destination page.
   */
  @step("custom_keywords.Click And Wait For Navigation With Retry")
  async clickAndWaitForNavigationWithRetry(
    click_selector: string | Locator,
    target_element_selector: string,
    max_attempts: string = "2",
    nav_timeout: string = "10s"
  ) {
    let url_before: RobotValue, attempt: RobotValue, target_exists: RobotValue, url_after: RobotValue;
    // Get URL before click to detect if navigation happened
    url_before = this.page.url();

    for (attempt = 1; attempt < Number(max_attempts) + 1; attempt++) {
      await log(`Attempt ${str(attempt)} of ${max_attempts}: Clicking ${str(click_selector)}`);

      // Port: the click scrolls the element into view and waits until it's stable and enabled (Playwright's
      // auto-waiting), so there's no Scroll To Element and Wait For Elements State before it
      await this.locate(click_selector).focus();
      await this.locate(click_selector).click();

      // Wait for target element to appear (indicates successful navigation)
      // Port: expect waits for it, instead of Run Keyword And Return Status around Wait For Elements State
      target_exists = await expect(this.page.locator(target_element_selector))
        .toBeVisible({ timeout: timeToMs(nav_timeout) })
        .then(
          () => true,
          () => false
        );

      if (isTruthy(target_exists)) {
        await log(`✅ Successfully navigated on attempt ${str(attempt)}`);
        return;
      }

      // Target element not found - check if we should retry
      url_after = this.page.url();
      if (url_after === url_before) {
        await log(`⚠️ Navigation did not occur on attempt ${str(attempt)}, URL unchanged`);
      } else {
        await log(`⚠️ URL changed to ${str(url_after)} but target element not found`);
      }

      // Retry if we have more attempts
      if (Number(attempt) < Number(max_attempts)) {
        await log("Waiting before retry...");
        await this.page.waitForTimeout(2000);
      }
    }

    throw new Error(
      `ERROR: Failed to navigate after ${max_attempts} attempts. Target element '${target_element_selector}' not found. Check screenshot.`
    );
  }

  /**
   * Clicks an element and waits until the URL has changed, or contains ${url_part} when given.
   * Content of the new page is waited for by the keywords that use it.
   */
  @step("custom_keywords.Click And Wait For Page")
  async clickAndWaitForPage(
    click_selector: string,
    url_part: RobotValue = "",
    timeout: string = V.BROWSER_TIMEOUT_GLOBAL
  ) {
    let url_before: RobotValue;
    url_before = this.page.url();
    await this.page.locator(click_selector).click();
    // Port: waitForURL waits for the new URL and then for the page to load, instead of Wait Until Keyword Succeeds
    // with Url Should Have Changed and Wait For Load State. After a client side navigation the page has loaded already.
    await this.page.waitForURL(
      (url) => (url_part !== "" ? url.href.includes(str(url_part)) : url.href !== url_before),
      { timeout: timeToMs(timeout), waitUntil: "load" }
    );
  }

  @step("custom_keywords.Wait For Url To Contain")
  async waitForUrlToContain(url_part: string, timeout: string = "20s") {
    // Port: expect retries until the URL contains url_part, instead of Wait Until Keyword Succeeds with Url Should
    // Have Changed
    await expect(this.page).toHaveURL((url) => url.href.includes(url_part), { timeout: timeToMs(timeout) });
  }

  /** An HDS Select ignores a close within 200 ms of opening, so its list can stay open after the pick. */
  @step("custom_keywords.Close Select List If Open")
  async closeSelectListIfOpen(main_button: RobotValue) {
    // Port: expect(...).toPass retries every 300 ms, instead of Wait Until Keyword Succeeds
    await expect(async () => {
      await this.selectListShouldBeClosed(main_button);
    }).toPass({ intervals: [300], timeout: 5000 });
  }

  @step("custom_keywords.Select List Should Be Closed")
  async selectListShouldBeClosed(main_button: RobotValue) {
    let expanded: RobotValue;
    expanded = await this.locate(main_button).getAttribute("aria-expanded");
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
  async retryWithRecovery(
    keyword: (...args: RobotValue[]) => Promise<unknown>,
    recovery: () => Promise<unknown>,
    ...args: RobotValue[]
  ) {
    let attempts: RobotValue, attempt: RobotValue, error: RobotValue;
    [args, { attempts }] = namedOnly(args, { attempts: "3" });
    for (attempt = 1; attempt < Number(attempts) + 1; attempt++) {
      try {
        await keyword(...args);
        return;
      } catch (err) {
        rethrowSkip(err);
        error = errorMessage(err);
        await log(`Attempt ${str(attempt)}/${str(attempts)} of ${str(keyword)} failed: ${str(error)}`, {
          level: "WARN",
        });
        if (str(attempt) === str(attempts)) {
          throw new Error(error);
        }
        await recovery();
      }
    }
  }

  /** This keyword verifies that an element containing the specified text is NOT found within a list of elements identified by the given selector. */
  @step("custom_keywords.Verify Element With Text Is Not Found")
  async verifyElementWithTextIsNotFound(element_with_text: string, wanted_text: RobotValue) {
    await log(`Verifying that ${element_with_text} with text: ${str(wanted_text)} is NOT found`);
    // Port: expect.poll reads the elements' texts (stripped, for webkit) again until none of them is the text,
    // instead of reading them once in a loop
    await expect
      .poll(async () => (await this.page.locator(element_with_text).allInnerTexts()).map((text) => text.trim()), {
        message: `Element with text "${str(wanted_text)}" was found but should not be present`,
      })
      .not.toContain(str(wanted_text));
  }

  /** This keyword verifies that an element identified by the given selector is NOT found on the page. */
  @step("custom_keywords.Verify Element Is Not Found")
  async verifyElementIsNotFound(element_selector: string) {
    await log(`Verifying that element ${element_selector} is NOT found`);

    // Port: waits until the element is gone (expect's timeout) instead of counting the elements once
    await expect(
      this.page.locator(element_selector),
      `Element "${element_selector}" was found but should not be present`
    ).toHaveCount(0);

    await log(`Element "${element_selector}" is correctly not present on the page`);
  }

  /** This keyword verifies that an element identified by the given selector IS found on the page. */
  @step("custom_keywords.Verify Element Is Found")
  async verifyElementIsFound(element_selector: string) {
    await log(`Verifying that element ${element_selector} IS found`);

    // Port: waits until the element is there (expect's timeout) instead of counting the elements once
    await expect(
      this.page.locator(element_selector),
      `Element "${element_selector}" was not found but should be present`
    ).not.toHaveCount(0);

    await log(`Element "${element_selector}" is correctly present on the page`);
  }

  @step("custom_keywords.Find And Click Element With Exact Text Using JS")
  async findAndClickElementWithExactTextUsingJs(element_with_text: RobotValue, wanted_text: RobotValue) {
    let elements_with_text: RobotValue, found: RobotValue, element: RobotValue, el_text: RobotValue;
    await log(`Searching for element with text: ${str(wanted_text)}`);
    elements_with_text = await elementsOf(this.locate(element_with_text));
    found = "False"; // Initialize a flag to track if the element is found

    for (element of elements_with_text) {
      el_text = await element.innerText();
      await log(`element is: ${str(element)}`);
      await log(`Text found in element: ${str(el_text)}`);

      if (str(el_text) === str(wanted_text)) {
        // A click event, like the DOM's click(): the element needn't be visible or in view
        await element.dispatchEvent("click");
        await log(`Element with text "${str(wanted_text)}" clicked using JavaScript.`);
        found = "True"; // Set the flag to True since the element is found and clicked
        break;
      }
    }

    // Fail the test if no element was found
    if (!isTruthy(found)) {
      throw new Error(`Element with text "${str(wanted_text)}" not found`);
    }
  }

  /** Finds an element containing the specified partial text and clicks it using JavaScript. */
  @step("custom_keywords.Find And Click Element With Partial Text Using JS")
  async findAndClickElementWithPartialTextUsingJs(element: RobotValue, partial_text: RobotValue) {
    let elements: RobotValue,
      element_count: RobotValue,
      clicked: RobotValue,
      e: RobotValue,
      text: RobotValue,
      clean_text: RobotValue,
      is_match: RobotValue;
    // Get all matching elements based on the selector
    elements = await elementsOf(this.locate(element));
    element_count = elements.length;
    await log(`Found ${str(element_count)}`);

    // Initialize variable to track if we clicked an element
    clicked = "False";

    // Loop through each element to find matching elements with the partial text
    for (e of elements) {
      text = await e.innerText();

      // Remove non-breaking spaces for accurate text comparison
      clean_text = await this.removeNonBreakingSpace(text);

      // Log for troubleshooting
      await log(`Cleaned Text: ${str(clean_text)}`);

      // Check if the cleaned text contains the partial text
      is_match = str(clean_text).includes(str(partial_text));

      // Click if a match is found and immediately break the loop
      if (isTruthy(is_match)) {
        // A click event, like the DOM's click(): the element needn't be visible or in view
        await e.dispatchEvent("click");
      }
      if (isTruthy(is_match)) {
        // Set Variable    ${clicked}    True
      }
      if (isTruthy(is_match)) {
        break;
      }
    }

    // Log if no match was found
    if (!isTruthy(clicked)) {
      await log(`No element with text '${str(partial_text)}' was found to click.`);
    }
  }

  /**
   * For each element matching ${card_element}, checks if it contains a child
   * ${text_element} with text ${text}. If so, clicks ${element_to_click} inside that card.
   */
  @step("custom_keywords.Find And Click Element In Card Element By Text")
  async findAndClickElementInCardElementByText(
    card_element: string,
    text_element: string,
    text: RobotValue,
    element_to_click: string
  ) {
    let cards: RobotValue,
      count: RobotValue,
      found: RobotValue,
      index: RobotValue,
      text_element_exists: RobotValue,
      el_text: RobotValue;
    await log(`Searching for cards: ${card_element}`);
    cards = await elementsOf(this.page.locator(card_element));
    count = cards.length;
    await log(`Found ${str(count)} card containers.`);
    found = "False";

    for (index = 0; index < Number(count); index++) {
      await log(`Checking card at index ${str(index)}`);

      // Check if text element exists within the current card (a card is rendered whole)
      text_element_exists = (await cards[index].locator(text_element).count()) > 0;

      if (isTruthy(text_element_exists)) {
        el_text = await cards[index].locator(text_element).innerText();
        el_text = await String_["Strip String"](el_text);
        await log(`Found text in card: ${str(el_text)}`);

        if (str(el_text) === str(text)) {
          await log(`Found matching text '${str(text)}' in card at index ${str(index)}`);
          // Found the card with the desired text, now click the target element inside this card
          await cards[index].locator(element_to_click).click();
          await log(`Clicked element '${element_to_click}' in card containing text '${str(text)}'`);
          found = "True";
          break;
        }
      }
    }

    if (!isTruthy(found)) {
      throw new Error(`No card element found with text '${str(text)}' in '${text_element}'`);
    }
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
    let group_wrappers: RobotValue,
      group_count: RobotValue,
      target_group_wrapper: RobotValue,
      found_target_group: RobotValue,
      wrapper: RobotValue,
      wrapper_text: RobotValue,
      contains_group_text: RobotValue,
      card_contents: RobotValue,
      card_count: RobotValue,
      matching_card: RobotValue,
      found_match: RobotValue,
      card: RobotValue,
      is_match: RobotValue;
    await log(`Searching for group wrapper containing "${group_text}"`);

    // Find all group wrappers
    group_wrappers = await elementsOf(this.page.locator(group_wrapper_selector));
    group_count = group_wrappers.length;
    await log(`Found ${str(group_count)} group wrappers.`);

    target_group_wrapper = null;
    found_target_group = "False";

    // Find the target group wrapper with specified text
    for (wrapper of group_wrappers) {
      wrapper_text = await wrapper.innerText();
      wrapper_text = await String_["Strip String"](wrapper_text);
      await log(`Checking group wrapper text: ${str(wrapper_text)}`);

      contains_group_text = str(wrapper_text).includes(group_text);
      if (isTruthy(contains_group_text)) {
        target_group_wrapper = wrapper;
        found_target_group = "True";
        await log(`Found target group wrapper containing "${group_text}"`);
        break;
      }
    }

    if (!isTruthy(found_target_group)) {
      throw new Error(`No group wrapper found containing "${group_text}" text`);
    }

    // Find card elements within the target group wrapper and reverse to find last match efficiently
    card_contents = await elementsOf(target_group_wrapper.locator(card_selector));
    card_count = card_contents.length;
    await log(`Found ${str(card_count)} card elements in target group.`);

    // Reverse the list to find the last matching card with early termination
    await Collections["Reverse List"](card_contents);

    matching_card = null;
    found_match = "False";

    for (card of card_contents) {
      is_match = await this.cardMatches(card, heading_selector, heading_text, tags_selector, tags_text);
      if (isTruthy(is_match)) {
        matching_card = card;
        found_match = "True";
        await log("Found last matching card (first match in reversed list)");
        break;
      }
    }

    if (!isTruthy(found_match)) {
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
    card: RobotValue,
    heading_selector: RobotValue,
    heading_text: RobotValue,
    tags_selector: RobotValue,
    tags_text: RobotValue
  ) {
    let heading_contains: RobotValue, tags_contains: RobotValue;
    // Check heading text contains the expected text
    heading_contains = await this.checkElementContainsText(
      card.locator(heading_selector),
      heading_text,
      undefined,
      undefined,
      /* return_status= */ "True"
    );
    if (!isTruthy(heading_contains)) {
      return "False";
    }

    // Check tags text contains the expected text
    tags_contains = await this.checkElementContainsText(
      card.locator(tags_selector),
      tags_text,
      undefined,
      undefined,
      /* return_status= */ "True"
    );
    return tags_contains;
  }

  /** Helper keyword to find and click a button with specific text in a card */
  @step("custom_keywords.Click Button In Card")
  async clickButtonInCard(card: RobotValue, button_text: RobotValue) {
    let buttons: RobotValue, button_count: RobotValue, button: RobotValue, text_matches: RobotValue;
    buttons = await elementsOf(card.locator("button"));
    button_count = buttons.length;
    await log(`Found ${str(button_count)} buttons in card`);

    for (button of buttons) {
      text_matches = await this.checkElementsText(
        button,
        button_text,
        undefined,
        undefined,
        /* return_status= */ "True"
      );
      if (isTruthy(text_matches)) {
        await button.click();
        await log(`Clicked "${str(button_text)}" button successfully`);
        return;
      }
    }

    throw new Error(`No "${str(button_text)}" button found in card`);
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
    let message_selector: RobotValue, message_elements: RobotValue, element_count: RobotValue, element_text: string;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let message_found: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let found_text: RobotValue;
    await log(`Starting verification for empty state message: "${empty_state_message}"`);
    await log("Context: Test creates 1 application, cancels it, then verifies no applications remain");

    // Get all elements that could contain the message
    message_selector = "#main >> span";
    message_elements = await elementsOf(this.page.locator(message_selector));
    element_count = message_elements.length;

    if (Number(element_count) === 0) {
      throw new Error(`No message elements found using selector: ${str(message_selector)}`);
    }

    await log(`Found ${str(element_count)} potential message element(s) to check`);

    // Check if any element contains the expected message
    message_found = "False";
    found_text = "";

    for (element_text of (await this.page.locator(message_selector).allInnerTexts()).map((text) => text.trim())) {
      // Check for exact match
      if (str(element_text) === empty_state_message) {
        message_found = "True";
        found_text = element_text;
        await log(`SUCCESS: Found expected empty state message: "${empty_state_message}"`);
        return;
      }
    }

    // If message not found, raise error (message should exist after cancellation)
    throw new Error(
      `Expected empty state message "${empty_state_message}" not found. This indicates applications still exist after cancellation, but none should remain.`
    );
  }

  @step("custom_keywords.Find Text From Elements Or Fail")
  async findTextFromElementsOrFail(element_with_text: string, wanted_text: RobotValue) {
    await log(`Searching for text: ${str(wanted_text)}`);
    // Port: expect.poll reads the elements' texts again until one of them is the wanted text (both stripped),
    // instead of reading them once in a loop
    await expect
      .poll(async () => (await this.page.locator(element_with_text).allInnerTexts()).map((text) => text.trim()), {
        message: `"Text '${str(wanted_text)}' not found in any given elements."`,
      })
      .toContain(str(wanted_text).trim());
    await log(`Found element with text: "${str(wanted_text).trim()}."`);
  }

  @step("custom_keywords.Find Text Element From Elements")
  async findTextElementFromElements(element_with_text: RobotValue, wanted_text: RobotValue) {
    let elements_with_text: RobotValue, text_found: RobotValue, element: RobotValue, el_text: RobotValue;
    await log(`Searching for text: ${str(wanted_text)}`);
    elements_with_text = await elementsOf(this.locate(element_with_text));
    text_found = "False"; // Initialize the flag to False

    for (element of elements_with_text) {
      el_text = (await element.innerText()).trim();
      wanted_text = str(wanted_text).trim();
      await log(`Found text in element: ${str(el_text)}`);

      if (str(el_text) === str(wanted_text)) {
        await log(`Found element with text "${str(wanted_text)}."`);
        text_found = "True"; // Set the flag to True when text is found
        return element; // Return the matching element
      }
    }

    if (!isTruthy(text_found)) {
      await log(`"Text '${str(wanted_text)}' not found in any given elements."`);
      return "False";
    }
  }

  @step("custom_keywords.Remove Non-breaking Space")
  async removeNonBreakingSpace(string: RobotValue) {
    await log(`Original string: '${str(string)}'`);
    string = String(string)
      .replaceAll(/\u00A0|\u200B|\u200C|\u200D|\u202F/g, " ")
      .trim();

    await log(`Normalized string: '${str(string)}'`);
    return string;
  }

  /** Verifies if a number extracted from the specified text element matches the expected value. */
  @step("custom_keywords.Check Number From Text Is Equal To")
  async checkNumberFromTextIsEqualTo(text_element: string, number_equalTo: RobotValue) {
    let number_element_string: RobotValue, NUM_FROM_TXT: RobotValue;
    await log(number_equalTo);
    const number_element = this.page.locator(text_element);
    // Reads the element's digits again until they are the expected number
    await expect
      .poll(async () => (await number_element.innerText()).replaceAll(/[^0-9]/g, ""), {
        message: `The number in ${text_element} is not ${str(number_equalTo)}`,
      })
      .toBe(number_equalTo);
    number_element_string = await number_element.innerText();
    await log(number_element_string);
    NUM_FROM_TXT = number_element_string.replaceAll(/[^0-9]/g, "");
    await log(NUM_FROM_TXT);
  }

  /** Verifies if a number extracted from the specified text element does NOT match the expected value. */
  @step("custom_keywords.Check Number From Text Is Not Equal To")
  async checkNumberFromTextIsNotEqualTo(text_element: RobotValue, number_notEqualTo: RobotValue) {
    let number_element_string: RobotValue, NUM_FROM_TXT: RobotValue;
    await log(`Expected number should NOT be: ${str(number_notEqualTo)}`);
    await this.locate(text_element).waitFor({ state: "visible" });
    number_element_string = await this.locate(text_element).innerText();
    await log(`Original text from element: ${str(number_element_string)}`);
    NUM_FROM_TXT = str(number_element_string).replaceAll(/[^0-9]/g, "");
    await log(`Extracted number: ${str(NUM_FROM_TXT)}`);
    expect(NUM_FROM_TXT).not.toBe(number_notEqualTo);
    await log(`✓ Numbers are different: ${str(NUM_FROM_TXT)} != ${str(number_notEqualTo)}`);
  }

  /**
   * Extracts only numeric characters from an element's text and returns the number.
   * Returns empty string if no numbers are found.
   */
  @step("custom_keywords.Get Number From Element Text")
  async getNumberFromElementText(text_element: string) {
    let element_text: RobotValue, numbers_only: RobotValue;
    await this.page.locator(text_element).waitFor({ state: "visible" });
    element_text = await this.page.locator(text_element).innerText();
    await log(`Original text: ${str(element_text)}`);
    numbers_only = element_text.replaceAll(/[^0-9]/g, "");
    await log(`Extracted numbers: ${str(numbers_only)}`);
    return numbers_only;
  }

  @step("custom_keywords.Check Elements Text With Remove Non-breaking Space")
  async checkElementsTextWithRemoveNonBreakingSpace(Element: string, Expected_text: RobotValue) {
    await log(`Element: ${Element}`);
    await log(`Expected text: ${str(Expected_text)}`);

    // Port: expect waits until the text matches. It normalizes whitespace, non-breaking spaces included.
    await expect(this.page.locator(Element)).toHaveText(str(Expected_text), { useInnerText: true, timeout: 20_000 });
  }

  /**
   * Compares the text content of an element with the expected text
   * normalizes it, and logs differences if mismatched.
   */
  @step("custom_keywords.Check Text Of Element With Normalization And Logging To File")
  async checkTextOfElementWithNormalizationAndLoggingToFile(Element: RobotValue, Expected_text: RobotValue) {
    let Elements_text: RobotValue,
      status: RobotValue,
      message: RobotValue,
      differences: RobotValue,
      timestamp: RobotValue,
      header: RobotValue,
      formatted_differences: RobotValue,
      content: RobotValue;
    await log(`Element: ${str(Element)}`);
    await log(`Expected text: ${str(Expected_text)}`);

    // Wait until the element is visible on the page
    await this.locate(Element).waitFor({ state: "visible" });

    // Retrieve the text content of the element
    Elements_text = await this.locate(Element).innerText();
    await log(`Retrieved text: ${str(Elements_text)}`);

    // Initial text comparison
    status = Elements_text === Expected_text ? "PASS" : "FAIL";
    message = status === "PASS" ? null : `${str(Elements_text)} != ${str(Expected_text)}`;

    await log(`Initial comparison status: ${str(status)}, message: ${str(message)}`);

    // If texts match, stop execution here
    if (str(status) === "PASS") {
      await log("Texts match. Test passes.");
      return;
    }

    // If texts do not match, perform normalization
    await log("Texts do not match. Attempting normalization.");

    // Normalize the actual elements text by removing non-breaking spaces
    Elements_text = await this.removeNonBreakingSpace(Elements_text);

    await log(`After normalization, actual text: ${str(Elements_text)}, expected text: ${str(Expected_text)}`);

    // Compare again after normalization
    status = Elements_text === Expected_text ? "PASS" : "FAIL";
    message = status === "PASS" ? null : `${str(Elements_text)} != ${str(Expected_text)}`;

    await log(`Comparison status after normalization: ${str(status)}, message: ${str(message)}`);

    // If texts match after normalization, stop execution here
    if (str(status) === "PASS") {
      await log("Texts match after normalization. Test passes.");
      return;
    }

    // If texts still do not match, log the differences
    await log("Texts still do not match after normalization.");

    // Log differences using the Python function
    differences = await python_keywords.log_differences(Elements_text, Expected_text);

    // Get the timestamp
    // "YYYY-MM-DD HH:MM:SS" in local time (the Swedish locale writes dates and times like that)
    timestamp = new Date().toLocaleString("sv-SE");

    // Create the header
    header = `Test Name: ${robot.TEST_NAME}
Timestamp: ${str(timestamp)}
Differences:
`;

    // Format the differences
    formatted_differences = differences
      .map(
        (diff: RobotValue) =>
          `Position: ${String(diff.position)} | Elements Text: ${JSON.stringify(diff.elementsText)} | Expected Text: ${JSON.stringify(diff.expectedText)}`
      )
      .join("\n");

    // Combine header and differences
    content = `${str(header)}${str(formatted_differences)}`;

    // Write to file
    await OperatingSystem["Append To File"](`debug_${robot.TEST_NAME}.txt`, content);

    // Fail the test with a descriptive message
    throw new Error(
      `Texts still do not match after normalization. Differences logged to debug_${robot.TEST_NAME}.txt.`
    );
  }

  /**
   * Checks element text with automatic space stripping and flexible comparison options.
   * Retries until the text matches, so slowly rendered text is waited for.
   * With return_status=True the text is checked once and True or False is returned.
   */
  @step("custom_keywords.Check Elements Text")
  async checkElementsText(
    Element: RobotValue,
    Expected_text: RobotValue,
    strip_spaces: RobotValue = "True",
    ignore_case: RobotValue = "False",
    return_status: RobotValue = "False",
    message: RobotValue = null
  ) {
    let default_msg: RobotValue, final_msg: RobotValue, status: RobotValue;
    await log(`Element: ${str(Element)}`);
    await log(`Expected text: ${str(Expected_text)}`);

    // Determine the error message to use
    default_msg = `Element text does not match. Element: ${str(Element)}`;
    final_msg = str(message) !== "None" ? message : default_msg;

    // Return status boolean for loops vs fail test for assertions
    if (isTruthy(return_status)) {
      // Wait until the element is visible on the page
      await this.locate(Element).waitFor({ state: "visible", timeout: 10_000 });
      try {
        await this.elementTextShouldBe(Element, Expected_text, strip_spaces, ignore_case, final_msg);
        status = true;
      } catch {
        status = false;
      }
      return status;
    }
    // Port: expect waits for the element and retries until its text matches, instead of the visible wait (10 s) and
    // Wait Until Keyword Succeeds (CONTENT_WAIT_TIMEOUT). It compares the text with its whitespace normalized.
    await expect(this.locate(Element), str(final_msg)).toHaveText(str(Expected_text), {
      ignoreCase: isTruthy(ignore_case),
      useInnerText: true,
      timeout: 10_000 + timeToMs(V.CONTENT_WAIT_TIMEOUT),
    });
  }

  @step("custom_keywords.Element Text Should Be")
  async elementTextShouldBe(
    element: RobotValue,
    expected_text: RobotValue,
    strip_spaces: RobotValue,
    ignore_case: RobotValue,
    message: RobotValue
  ) {
    let text: RobotValue, expected: string;
    text = await this.locate(element).innerText();
    expected = str(expected_text);
    if (isTruthy(strip_spaces)) {
      text = text.trim();
      expected = expected.trim();
    }
    if (isTruthy(ignore_case)) {
      text = text.toLowerCase();
      expected = expected.toLowerCase();
    }
    expect(text, message == null ? undefined : str(message)).toBe(expected);
  }

  /** Checks if element text contains expected text using Should Contain */
  @step("custom_keywords.Check Element Contains Text")
  async checkElementContainsText(
    Element: RobotValue,
    Expected_text: RobotValue,
    strip_spaces: RobotValue = "True",
    ignore_case: RobotValue = "False",
    return_status: string = "False"
  ) {
    let Elements_text: RobotValue, status: RobotValue;
    await log(`Element: ${str(Element)}`);
    await log(`Expected text: ${str(Expected_text)}`);

    // Return status boolean for loops vs fail test for assertions
    if (isTruthy(return_status)) {
      // Wait until the element is visible on the page
      await this.locate(Element).waitFor({ state: "visible", timeout: 10_000 });

      // Retrieve the text content of the element
      Elements_text = await this.locate(Element).innerText();

      // Does the element text contain the expected text
      let haystack = str(Elements_text),
        needle = str(Expected_text);
      if (isTruthy(strip_spaces)) {
        haystack = haystack.trim();
        needle = needle.trim();
      }
      if (isTruthy(ignore_case)) {
        haystack = haystack.toLowerCase();
        needle = needle.toLowerCase();
      }
      status = haystack.includes(needle);
      return status;
    }
    // Port: expect waits for the element and retries until its text contains the expected text, instead of the
    // Sleep (1 s) and reading the text once. It compares the text with its whitespace normalized.
    await expect(
      this.locate(Element),
      `Element text does not contain expected text. Element: ${str(Element)}`
    ).toContainText(str(Expected_text), { ignoreCase: isTruthy(ignore_case), useInnerText: true, timeout: 10_000 });
  }

  // Calendar extraction
  /** Converts a booking time string to ICS format with time zone information. */
  @step("custom_keywords.Convert Booking Time To ICS Format")
  async convertBookingTimeToIcsFormat(time_string: RobotValue) {
    let timezone: RobotValue, ics_start: RobotValue, ics_end: RobotValue;
    // Check System Time Zone
    timezone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    await log(`Current system time zone is: ${str(timezone)}`);
    await log(`This is the timeslot ${str(time_string)}`);

    // Convert booking time to ICS format using the Python function
    [ics_start, ics_end] = python_keywords.convert_booking_time_to_ics(time_string);
    await log(`ICS Start Time: ${str(ics_start)}`);
    await log(`ICS End Time: ${str(ics_end)}`);
    V.FORMATTED_START_TO_ICS = ics_start;
    V.FORMATTED_END_TO_ICS = ics_end;
  }

  @step("custom_keywords.Extract Start And End Time From ICS File")
  async extractStartAndEndTimeFromIcsFile(text_from_ics_file: RobotValue) {
    let dtstart_pattern: RobotValue,
      dtend_pattern: RobotValue,
      dtstart_matches: RobotValue,
      dtend_matches: RobotValue,
      start_match: RobotValue,
      end_match: RobotValue;
    // Log the ICS text for debugging
    await log(`ICS Text: ${str(text_from_ics_file)}`);

    // For testing
    // ${text_from_ics_file}=  Set Variable  asdfasfasdf_DTSTART;TZID=America/New_York:20241003T083000..werwer_DTEND;TZID=America/New_York:20241003T093000

    // Targets the event-specific DTSTART and DTEND lines with TZID.
    dtstart_pattern = "DTSTART;TZID=Europe/Helsinki:[0-9]{8}T[0-9]{6}";
    dtend_pattern = "DTEND;TZID=Europe/Helsinki:[0-9]{8}T[0-9]{6}";

    // Find all matches in the ICS text
    dtstart_matches = await String_["Get Regexp Matches"](text_from_ics_file, dtstart_pattern);
    dtend_matches = await String_["Get Regexp Matches"](text_from_ics_file, dtend_pattern);

    // Check if matches are found and directly use the first match for DTSTART and DTEND
    if (dtstart_matches.length === 0) {
      throw new Error("No DTSTART matches found in the text");
    }
    if (dtend_matches.length === 0) {
      throw new Error("No DTEND matches found in the text");
    }

    start_match = await Collections["Get From List"](dtstart_matches, "0");
    end_match = await Collections["Get From List"](dtend_matches, "0");
    await log(`Start match: ${str(start_match)} and End match: ${str(end_match)}`);

    // Set the extracted matches as suite variables
    V.START_TIME_FROM_ICS = start_match;
    V.END_TIME_FROM_ICS = end_match;

    // Log the variables for confirmation
    await log(`Start datetime: ${str(V.START_TIME_FROM_ICS)}`);
    await log(`End datetime: ${str(V.END_TIME_FROM_ICS)}`);
  }

  /**
   * Checks that a given weekday's column in the calendar contains
   * an event label exactly matching the specified time.
   */
  @step("custom_keywords.Verify Reservation Slot Exists")
  async verifyReservationSlotExists(TIME_TO_CHECK: RobotValue, DAY_TO_CHECK: RobotValue) {
    let normTime: string, days: string[], dayIdx: number, labels: RobotValue, count: RobotValue, txt: string;
    // normalize search key
    normTime = normalizeTimeLabel(str(TIME_TO_CHECK));
    await log(`Normalized search ➔ ${normTime}`);

    // pick correct column index
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    dayIdx = days.indexOf(str(DAY_TO_CHECK));
    expect(Number(dayIdx), `Day "${str(DAY_TO_CHECK)}" not found`).toBeGreaterThanOrEqual(0);
    await log(`Checking column index ${str(Number(dayIdx) + 2)}`);

    const day_labels = this.page.locator(
      `.rbc-time-column:nth-child(${dayIdx + 2}) .rbc-events-container .rbc-event-label`
    );
    labels = await elementsOf(day_labels);
    count = labels.length;
    await log(`Found ${str(count)} label(s) on ${str(DAY_TO_CHECK)}`);
    expect(
      Number(count),
      `No reservation labels found. There should be at least one ${str(DAY_TO_CHECK)}`
    ).toBeGreaterThan(0);

    // Port: a local flag, Set Test Variable in the Robot suite (nothing else reads it)
    let found = false;

    for (txt of (await day_labels.allInnerTexts()).map((label) => normalizeTimeLabel(label))) {
      await log(`Normalized label ➔ ${txt}`);
      if (txt === normTime) {
        found = true;
        await log("Match found!");
        break;
      }
    }

    await log(`Final result: ${str(found)}`);
    expect(found, `Reservation not found for ${str(DAY_TO_CHECK)} at ${str(TIME_TO_CHECK)}`).toBe(true);

    // Calendar extraction
  }
}
