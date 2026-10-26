/** A resource file with keywords. */
import { Browser } from "../../lib/Browser";
import { BuiltIn } from "../../lib/BuiltIn";
import { Collections } from "../../lib/Collections";
import { OperatingSystem } from "../../lib/OperatingSystem";
import { V, chain, errorMessage, isTruthy, keywords, named, namedOnly, rethrowSkip, robot, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import { String_ } from "../../lib/String";
import { python_keywords } from "../Resources/python_keywords";
import "../Resources/variables";
import "../Resources/texts_FI";
import "../Resources/serial_users";

export const custom_keywords = keywords("custom_keywords", {
  /**
   * This keyword clicks the first element with exactly the specified text among the elements identified by the given selector.
   * It waits for such an element to appear, so slowly rendered lists are waited for.
   * The text has to be inside one element, text split over several child elements is not matched.
   */
  "Find And Click Element With Text": async (element_with_text: RobotValue, wanted_text: RobotValue) => {
    let target: RobotValue;
    target = chain(element_with_text, `text="${str(wanted_text)}" >> nth=0`);
    await Browser["Wait For Elements State"](
      target,
      "visible",
      named({ timeout: V.CONTENT_WAIT_TIMEOUT, message: `Element with text "${str(wanted_text)}" not found` })
    );
    await Browser["Click"](target);
    await BuiltIn["Log"](`Element with text "${str(wanted_text)}" clicked.`);
  },

  /**
   * Clicks an element and waits for navigation to complete with retry logic.
   * Handles flaky navigation by retrying click if target element doesn't appear.
   * Verifies navigation by checking for a target element on the destination page.
   */
  "Click And Wait For Navigation With Retry": async (
    click_selector: RobotValue,
    target_element_selector: RobotValue,
    max_attempts: RobotValue = "2",
    nav_timeout: RobotValue = "10s"
  ) => {
    let url_before: RobotValue,
      attempt: RobotValue,
      target_exists: RobotValue,
      url_after: RobotValue,
      still_on_same_page: RobotValue;
    // Get URL before click to detect if navigation happened
    url_before = await Browser["Get Url"]();

    for (attempt = 1; attempt < Number(max_attempts) + 1; attempt++) {
      await BuiltIn["Log"](`Attempt ${str(attempt)} of ${str(max_attempts)}: Clicking ${str(click_selector)}`);

      // Ensure element is in view and stable before clicking
      await Browser["Scroll To Element"](click_selector);
      await Browser["Wait For Elements State"](click_selector, "stable", named({ timeout: "5s" }));

      // Click the element
      await Browser["Focus"](click_selector);
      await Browser["Click"](click_selector);

      // Wait for target element to appear (indicates successful navigation)
      target_exists = await BuiltIn["Run Keyword And Return Status"](
        Browser["Wait For Elements State"],
        target_element_selector,
        "visible",
        named({ timeout: nav_timeout })
      );

      if (isTruthy(target_exists)) {
        await BuiltIn["Log"](`✅ Successfully navigated on attempt ${str(attempt)}`);
        return;
      }

      // Target element not found - check if we should retry
      url_after = await Browser["Get Url"]();
      still_on_same_page = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Be Equal"],
        url_before,
        url_after
      );

      if (isTruthy(still_on_same_page)) {
        await BuiltIn["Log"](`⚠️ Navigation did not occur on attempt ${str(attempt)}, URL unchanged`);
      } else {
        await BuiltIn["Log"](`⚠️ URL changed to ${str(url_after)} but target element not found`);
      }

      // Retry if we have more attempts
      if (Number(attempt) < Number(max_attempts)) {
        await BuiltIn["Log"]("Waiting before retry...");
        await BuiltIn["Sleep"]("2s");
      }
    }

    await BuiltIn["Fail"](
      `ERROR: Failed to navigate after ${str(max_attempts)} attempts. Target element '${str(target_element_selector)}' not found. Check screenshot.`
    );
  },

  /**
   * Clicks an element and waits until the URL has changed, or contains ${url_part} when given.
   * Content of the new page is waited for by the keywords that use it.
   */
  "Click And Wait For Page": async (
    click_selector: RobotValue,
    url_part: RobotValue = "",
    timeout: RobotValue = V.BROWSER_TIMEOUT_GLOBAL
  ) => {
    let url_before: RobotValue;
    url_before = await Browser["Get Url"]();
    await Browser["Click"](click_selector);
    await BuiltIn["Wait Until Keyword Succeeds"](
      timeout,
      "250ms",
      custom_keywords["Url Should Have Changed"],
      url_before,
      url_part
    );
    // Returns at once after client side navigation, waits for the document after a full page navigation
    await Browser["Wait For Load State"]("load", named({ timeout: "50s" }));
  },

  "Wait For Url To Contain": async (url_part: RobotValue, timeout: RobotValue = "20s") => {
    await BuiltIn["Wait Until Keyword Succeeds"](
      timeout,
      "250ms",
      custom_keywords["Url Should Have Changed"],
      "",
      url_part
    );
  },

  "Url Should Have Changed": async (url_before: RobotValue, url_part: RobotValue) => {
    let url: RobotValue;
    url = await Browser["Get Url"]();
    if (url_part !== "") {
      await BuiltIn["Should Contain"](url, url_part);
    } else {
      await BuiltIn["Should Not Be Equal"](url, url_before);
    }
  },

  /** An HDS Select ignores a close within 200 ms of opening, so its list can stay open after the pick. */
  "Close Select List If Open": async (main_button: RobotValue) => {
    await BuiltIn["Wait Until Keyword Succeeds"](
      "5s",
      "300ms",
      custom_keywords["Select List Should Be Closed"],
      main_button
    );
  },

  "Select List Should Be Closed": async (main_button: RobotValue) => {
    let expanded: RobotValue;
    expanded = await Browser["Get Attribute"](main_button, "aria-expanded");
    if (expanded === "true") {
      await Browser["Click"](main_button);
      expanded = await Browser["Get Attribute"](main_button, "aria-expanded");
    }
    await BuiltIn["Should Not Be Equal"](expanded, "true", named({ msg: "The select list did not close" }));
  },

  /**
   * Runs a keyword and, between failed attempts, a recovery keyword (for example Reload).
   * Fails with the error of the last attempt. Use only for steps that are safe to repeat.
   */
  "Retry With Recovery": async (keyword: RobotValue, recovery: RobotValue, ...args: RobotValue[]) => {
    let attempts: RobotValue, attempt: RobotValue, error: RobotValue;
    [args, { attempts }] = namedOnly(args, { attempts: "3" });
    for (attempt = 1; attempt < Number(attempts) + 1; attempt++) {
      try {
        await BuiltIn["Run Keyword"](keyword, ...args);
        return;
      } catch (err) {
        rethrowSkip(err);
        error = errorMessage(err);
        await BuiltIn["Log"](
          `Attempt ${str(attempt)}/${str(attempts)} of ${str(keyword)} failed: ${str(error)}`,
          named({ level: "WARN" })
        );
        if (str(attempt) === str(attempts)) {
          await BuiltIn["Fail"](error);
        }
        await BuiltIn["Run Keyword"](recovery);
      }
    }
  },

  /** This keyword verifies that an element containing the specified text is NOT found within a list of elements identified by the given selector. */
  "Verify Element With Text Is Not Found": async (element_with_text: RobotValue, wanted_text: RobotValue) => {
    let elements_with_text: RobotValue, found: RobotValue, element: RobotValue, el_text: RobotValue;
    await BuiltIn["Log"](`Verifying that ${str(element_with_text)} with text: ${str(wanted_text)} is NOT found`);
    elements_with_text = await Browser["Get Elements"](element_with_text);
    found = "False"; // Initialize a flag to track if the element is found

    for (element of elements_with_text) {
      el_text = await Browser["Get Text"](element);
      el_text = await String_["Strip String"](el_text); // Remove leading and trailing whitespaces for webkit
      await BuiltIn["Log"](`element is: ${str(element)}`);
      await BuiltIn["Log"](`Text found in element: ${str(el_text)}`);

      if (el_text === wanted_text) {
        await BuiltIn["Log"](`Element with text "${str(wanted_text)}" found when it should not be.`);
        found = "True"; // Set the flag to True since the element is found
        break;
      }
    }

    // Fail the test if the element WAS found (opposite of the original keyword)
    if (isTruthy(found)) {
      await BuiltIn["Fail"](`Element with text "${str(wanted_text)}" was found but should not be present`);
    }
  },

  /** This keyword verifies that an element identified by the given selector is NOT found on the page. */
  "Verify Element Is Not Found": async (element_selector: RobotValue) => {
    let element_count: RobotValue;
    await BuiltIn["Log"](`Verifying that element ${str(element_selector)} is NOT found`);
    element_count = await Browser["Get Element Count"](element_selector);
    await BuiltIn["Log"](`Element count: ${str(element_count)}`);

    // Fail the test if the element WAS found
    if (Number(element_count) > 0) {
      await BuiltIn["Fail"](
        `Element "${str(element_selector)}" was found but should not be present (count: ${str(element_count)})`
      );
    }

    await BuiltIn["Log"](`Element "${str(element_selector)}" is correctly not present on the page`);
  },

  /** This keyword verifies that an element identified by the given selector IS found on the page. */
  "Verify Element Is Found": async (element_selector: RobotValue) => {
    let element_count: RobotValue;
    await BuiltIn["Log"](`Verifying that element ${str(element_selector)} IS found`);
    element_count = await Browser["Get Element Count"](element_selector);
    await BuiltIn["Log"](`Element count: ${str(element_count)}`);

    // Fail the test if the element was NOT found
    if (Number(element_count) === 0) {
      await BuiltIn["Fail"](`Element "${str(element_selector)}" was not found but should be present`);
    }

    await BuiltIn["Log"](
      `Element "${str(element_selector)}" is correctly present on the page (count: ${str(element_count)})`
    );
  },

  "Find And Click Element With Exact Text Using JS": async (element_with_text: RobotValue, wanted_text: RobotValue) => {
    let elements_with_text: RobotValue, found: RobotValue, element: RobotValue, el_text: RobotValue;
    await BuiltIn["Log"](`Searching for element with text: ${str(wanted_text)}`);
    elements_with_text = await Browser["Get Elements"](element_with_text);
    found = "False"; // Initialize a flag to track if the element is found

    for (element of elements_with_text) {
      el_text = await Browser["Get Text"](element);
      await BuiltIn["Log"](`element is: ${str(element)}`);
      await BuiltIn["Log"](`Text found in element: ${str(el_text)}`);

      if (str(el_text) === str(wanted_text)) {
        await Browser["Evaluate JavaScript"](element, (element: RobotValue) => element.click());
        await BuiltIn["Log"](`Element with text "${str(wanted_text)}" clicked using JavaScript.`);
        found = "True"; // Set the flag to True since the element is found and clicked
        break;
      }
    }

    // Fail the test if no element was found
    if (!isTruthy(found)) {
      await BuiltIn["Fail"](`Element with text "${str(wanted_text)}" not found`);
    }
  },

  /** Finds an element containing the specified partial text and clicks it using JavaScript. */
  "Find And Click Element With Partial Text Using JS": async (element: RobotValue, partial_text: RobotValue) => {
    let elements: RobotValue,
      element_count: RobotValue,
      clicked: RobotValue,
      e: RobotValue,
      text: RobotValue,
      clean_text: RobotValue,
      is_match: RobotValue;
    // Get all matching elements based on the selector
    elements = await Browser["Get Elements"](element);
    element_count = elements.length;
    await BuiltIn["Log"](`Found ${str(element_count)}`);

    // Initialize variable to track if we clicked an element
    clicked = "False";

    // Loop through each element to find matching elements with the partial text
    for (e of elements) {
      text = await Browser["Get Text"](e);

      // Remove non-breaking spaces for accurate text comparison
      clean_text = await custom_keywords["Remove Non-breaking Space"](text);

      // Log for troubleshooting
      await BuiltIn["Log"](`Cleaned Text: ${str(clean_text)}`);

      // Check if the cleaned text contains the partial text
      is_match = str(clean_text).includes(str(partial_text));

      // Click if a match is found and immediately break the loop
      if (isTruthy(is_match)) {
        await Browser["Evaluate JavaScript"](e, (element: RobotValue) => element.click());
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
      await BuiltIn["Log"](`No element with text '${str(partial_text)}' was found to click.`);
    }
  },

  /**
   * For each element matching ${card_element}, checks if it contains a child
   * ${text_element} with text ${text}. If so, clicks ${element_to_click} inside that card.
   */
  "Find And Click Element In Card Element By Text": async (
    card_element: RobotValue,
    text_element: RobotValue,
    text: RobotValue,
    element_to_click: RobotValue
  ) => {
    let cards: RobotValue,
      count: RobotValue,
      found: RobotValue,
      index: RobotValue,
      text_element_exists: RobotValue,
      el_text: RobotValue;
    await BuiltIn["Log"](`Searching for cards: ${str(card_element)}`);
    cards = await Browser["Get Elements"](card_element);
    count = await BuiltIn["Get Length"](cards);
    await BuiltIn["Log"](`Found ${str(count)} card containers.`);
    found = "False";

    for (index = 0; index < Number(count); index++) {
      await BuiltIn["Log"](`Checking card at index ${str(index)}`);

      // Check if text element exists within the current card
      text_element_exists = await BuiltIn["Run Keyword And Return Status"](
        Browser["Get Element"],
        chain(cards[index], text_element)
      );

      if (isTruthy(text_element_exists)) {
        el_text = await Browser["Get Text"](chain(cards[index], text_element));
        el_text = await String_["Strip String"](el_text);
        await BuiltIn["Log"](`Found text in card: ${str(el_text)}`);

        if (str(el_text) === str(text)) {
          await BuiltIn["Log"](`Found matching text '${str(text)}' in card at index ${str(index)}`);
          // Found the card with the desired text, now click the target element inside this card
          await Browser["Click"](chain(cards[index], element_to_click));
          await BuiltIn["Log"](`Clicked element '${str(element_to_click)}' in card containing text '${str(text)}'`);
          found = "True";
          break;
        }
      }
    }

    if (!isTruthy(found)) {
      await BuiltIn["Fail"](`No card element found with text '${str(text)}' in '${str(text_element)}'`);
    }
  },

  /**
   * Finds a group wrapper containing specified text, then searches for card elements
   * within that group. For each card, checks if the heading and tags elements contain
   * specified text. If both conditions are met, clicks the specified button.
   */
  "Find And Click Button In Group With Matching Conditions": async (
    group_wrapper_selector: RobotValue,
    group_text: RobotValue,
    card_selector: RobotValue,
    heading_selector: RobotValue,
    heading_text: RobotValue,
    tags_selector: RobotValue,
    tags_text: RobotValue,
    button_text: RobotValue
  ) => {
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
    await BuiltIn["Log"](`Searching for group wrapper containing "${str(group_text)}"`);

    // Find all group wrappers
    group_wrappers = await Browser["Get Elements"](group_wrapper_selector);
    group_count = await BuiltIn["Get Length"](group_wrappers);
    await BuiltIn["Log"](`Found ${str(group_count)} group wrappers.`);

    target_group_wrapper = null;
    found_target_group = "False";

    // Find the target group wrapper with specified text
    for (wrapper of group_wrappers) {
      wrapper_text = await Browser["Get Text"](wrapper);
      wrapper_text = await String_["Strip String"](wrapper_text);
      await BuiltIn["Log"](`Checking group wrapper text: ${str(wrapper_text)}`);

      contains_group_text = str(wrapper_text).includes(str(group_text));
      if (isTruthy(contains_group_text)) {
        target_group_wrapper = wrapper;
        found_target_group = "True";
        await BuiltIn["Log"](`Found target group wrapper containing "${str(group_text)}"`);
        break;
      }
    }

    if (!isTruthy(found_target_group)) {
      await BuiltIn["Fail"](`No group wrapper found containing "${str(group_text)}" text`);
    }

    // Find card elements within the target group wrapper and reverse to find last match efficiently
    card_contents = await Browser["Get Elements"](chain(target_group_wrapper, card_selector));
    card_count = await BuiltIn["Get Length"](card_contents);
    await BuiltIn["Log"](`Found ${str(card_count)} card elements in target group.`);

    // Reverse the list to find the last matching card with early termination
    await Collections["Reverse List"](card_contents);

    matching_card = null;
    found_match = "False";

    for (card of card_contents) {
      is_match = await custom_keywords["Card Matches"](card, heading_selector, heading_text, tags_selector, tags_text);
      if (isTruthy(is_match)) {
        matching_card = card;
        found_match = "True";
        await BuiltIn["Log"]("Found last matching card (first match in reversed list)");
        break;
      }
    }

    if (!isTruthy(found_match)) {
      await BuiltIn["Fail"](
        `No card found with matching conditions: heading contains '${str(heading_text)}' and tags contain '${str(tags_text)}'`
      );
    }

    // Click the button in the matching card
    await custom_keywords["Click Button In Card"](matching_card, button_text);
  },

  /** Check if a card matches both heading and tags text criteria */
  "Card Matches": async (
    card: RobotValue,
    heading_selector: RobotValue,
    heading_text: RobotValue,
    tags_selector: RobotValue,
    tags_text: RobotValue
  ) => {
    let heading_contains: RobotValue, tags_contains: RobotValue;
    // Check heading text contains the expected text
    heading_contains = await custom_keywords["Check Element Contains Text"](
      chain(card, heading_selector),
      heading_text,
      undefined,
      undefined,
      /* return_status= */ "True"
    );
    if (!isTruthy(heading_contains)) {
      return "False";
    }

    // Check tags text contains the expected text
    tags_contains = await custom_keywords["Check Element Contains Text"](
      chain(card, tags_selector),
      tags_text,
      undefined,
      undefined,
      /* return_status= */ "True"
    );
    return tags_contains;
  },

  /** Helper keyword to find and click a button with specific text in a card */
  "Click Button In Card": async (card: RobotValue, button_text: RobotValue) => {
    let buttons: RobotValue, button_count: RobotValue, button: RobotValue, text_matches: RobotValue;
    buttons = await Browser["Get Elements"](chain(card, "button"));
    button_count = await BuiltIn["Get Length"](buttons);
    await BuiltIn["Log"](`Found ${str(button_count)} buttons in card`);

    for (button of buttons) {
      text_matches = await custom_keywords["Check Elements Text"](
        button,
        button_text,
        undefined,
        undefined,
        /* return_status= */ "True"
      );
      if (isTruthy(text_matches)) {
        await Browser["Click"](button);
        await BuiltIn["Log"](`Clicked "${str(button_text)}" button successfully`);
        return;
      }
    }

    await BuiltIn["Fail"](`No "${str(button_text)}" button found in card`);
  },

  /**
   * Verifies that a specific empty state message is displayed in the application.
   * 0. Before test runs: User data is set so there are NO other applications - everything is empty
   * 1. The test creates exactly 1 application
   * 2. The test then cancels that 1 application
   * 3. After cancellation, there should be NO other applications remaining
   * 4. An appropriate empty state message should be displayed
   */
  "Verify Card Not Found In Group With Matching Conditions": async (empty_state_message: RobotValue) => {
    let message_selector: RobotValue,
      message_elements: RobotValue,
      element_count: RobotValue,
      element: RobotValue,
      element_text: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let message_found: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let found_text: RobotValue;
    await BuiltIn["Log"](`Starting verification for empty state message: "${str(empty_state_message)}"`);
    await BuiltIn["Log"]("Context: Test creates 1 application, cancels it, then verifies no applications remain");

    // Get all elements that could contain the message
    message_selector = "id=main >> span";
    message_elements = await Browser["Get Elements"](message_selector);
    element_count = await BuiltIn["Get Length"](message_elements);

    if (Number(element_count) === 0) {
      await BuiltIn["Fail"](`No message elements found using selector: ${str(message_selector)}`);
    }

    await BuiltIn["Log"](`Found ${str(element_count)} potential message element(s) to check`);

    // Check if any element contains the expected message
    message_found = "False";
    found_text = "";

    for (element of message_elements) {
      element_text = await Browser["Get Text"](element);
      element_text = await String_["Strip String"](element_text);

      // Check for exact match
      if (str(element_text) === str(empty_state_message)) {
        message_found = "True";
        found_text = element_text;
        await BuiltIn["Log"](`SUCCESS: Found expected empty state message: "${str(empty_state_message)}"`);
        return;
      }
    }

    // If message not found, raise error (message should exist after cancellation)
    await BuiltIn["Fail"](
      `Expected empty state message "${str(empty_state_message)}" not found. This indicates applications still exist after cancellation, but none should remain.`
    );
  },

  "Find Text From Elements Or Fail": async (element_with_text: RobotValue, wanted_text: RobotValue) => {
    let elements_with_text: RobotValue,
      text_found: RobotValue,
      element: RobotValue,
      el_text: RobotValue,
      el_text_clean: RobotValue,
      wanted_text_clean: RobotValue;
    await BuiltIn["Log"](`Searching for text: ${str(wanted_text)}`);
    elements_with_text = await Browser["Get Elements"](element_with_text);
    text_found = "False"; // Initialize the flag to False

    for (element of elements_with_text) {
      el_text = await Browser["Get Text"](element);
      el_text_clean = await String_["Strip String"](el_text);
      wanted_text_clean = await String_["Strip String"](wanted_text);
      await BuiltIn["Log"](`Found text in element (cleaned): ${str(el_text_clean)}`);

      if (str(el_text_clean) === str(wanted_text_clean)) {
        await BuiltIn["Log"](`Found element with text: "${str(wanted_text_clean)}."`);
        text_found = "True"; // Set the flag to True when text is found
        break;
      }
    }

    if (!isTruthy(text_found)) {
      await BuiltIn["Fail"](`"Text '${str(wanted_text)}' not found in any given elements."`);
    }
  },

  "Find Text Element From Elements": async (element_with_text: RobotValue, wanted_text: RobotValue) => {
    let elements_with_text: RobotValue, text_found: RobotValue, element: RobotValue, el_text: RobotValue;
    await BuiltIn["Log"](`Searching for text: ${str(wanted_text)}`);
    elements_with_text = await Browser["Get Elements"](element_with_text);
    text_found = "False"; // Initialize the flag to False

    for (element of elements_with_text) {
      el_text = await Browser["Get Text"](element);
      el_text = await String_["Strip String"](el_text);
      wanted_text = await String_["Strip String"](wanted_text);
      await BuiltIn["Log"](`Found text in element: ${str(el_text)}`);

      if (str(el_text) === str(wanted_text)) {
        await BuiltIn["Log"](`Found element with text "${str(wanted_text)}."`);
        text_found = "True"; // Set the flag to True when text is found
        return element; // Return the matching element
      }
    }

    if (!isTruthy(text_found)) {
      await BuiltIn["Log"](`"Text '${str(wanted_text)}' not found in any given elements."`);
      return "False";
    }
  },

  "Remove Non-breaking Space": async (string: RobotValue) => {
    await BuiltIn["Log"](`Original string: '${str(string)}'`);
    string = String(string)
      .replaceAll(/\u00A0|\u200B|\u200C|\u200D|\u202F/g, " ")
      .trim();

    await BuiltIn["Log"](`Normalized string: '${str(string)}'`);
    return string;
  },

  /** Verifies if a number extracted from the specified text element matches the expected value. */
  "Check Number From Text Is Equal To": async (text_element: RobotValue, number_equalTo: RobotValue) => {
    let number_element_string: RobotValue, number_element_string_num_only: RobotValue, NUM_FROM_TXT: RobotValue;
    await BuiltIn["Log"](number_equalTo);
    await Browser["Wait For Elements State"](text_element, "visible");
    number_element_string = await Browser["Get Text"](text_element);
    await BuiltIn["Log"](number_element_string);
    number_element_string_num_only = await String_["Replace String Using Regexp"](number_element_string, "[^0-9]", "");

    NUM_FROM_TXT = number_element_string_num_only;
    await BuiltIn["Log"](NUM_FROM_TXT);
    await BuiltIn["Should Be Equal"](NUM_FROM_TXT, number_equalTo);
  },

  /** Verifies if a number extracted from the specified text element does NOT match the expected value. */
  "Check Number From Text Is Not Equal To": async (text_element: RobotValue, number_notEqualTo: RobotValue) => {
    let number_element_string: RobotValue, number_element_string_num_only: RobotValue, NUM_FROM_TXT: RobotValue;
    await BuiltIn["Log"](`Expected number should NOT be: ${str(number_notEqualTo)}`);
    await Browser["Wait For Elements State"](text_element, "visible");
    number_element_string = await Browser["Get Text"](text_element);
    await BuiltIn["Log"](`Original text from element: ${str(number_element_string)}`);
    number_element_string_num_only = await String_["Replace String Using Regexp"](number_element_string, "[^0-9]", "");
    NUM_FROM_TXT = number_element_string_num_only;
    await BuiltIn["Log"](`Extracted number: ${str(NUM_FROM_TXT)}`);
    await BuiltIn["Should Not Be Equal"](NUM_FROM_TXT, number_notEqualTo);
    await BuiltIn["Log"](`✓ Numbers are different: ${str(NUM_FROM_TXT)} != ${str(number_notEqualTo)}`);
  },

  /**
   * Extracts only numeric characters from an element's text and returns the number.
   * Returns empty string if no numbers are found.
   */
  "Get Number From Element Text": async (text_element: RobotValue) => {
    let element_text: RobotValue, numbers_only: RobotValue;
    await Browser["Wait For Elements State"](text_element, "visible");
    element_text = await Browser["Get Text"](text_element);
    await BuiltIn["Log"](`Original text: ${str(element_text)}`);
    numbers_only = await String_["Replace String Using Regexp"](element_text, "[^0-9]", "");
    await BuiltIn["Log"](`Extracted numbers: ${str(numbers_only)}`);
    return numbers_only;
  },

  "Check Elements Text With Remove Non-breaking Space": async (Element: RobotValue, Expected_text: RobotValue) => {
    let Elements_text: RobotValue;
    await BuiltIn["Sleep"]("2s");
    await BuiltIn["Log"](`Element: ${str(Element)}`);
    await BuiltIn["Log"](`Expected text: ${str(Expected_text)}`);

    // Wait until the element is visible on the page
    await Browser["Wait For Elements State"](Element, "visible");

    // Retrieve the text content of the element
    Elements_text = await Browser["Get Text"](Element);

    // Normalize the element's text by removing non-breaking spaces
    Elements_text = await custom_keywords["Remove Non-breaking Space"](Elements_text);

    // Final text comparison
    await BuiltIn["Should Be Equal"](Elements_text, Expected_text);
  },

  /**
   * Compares the text content of an element with the expected text
   * normalizes it, and logs differences if mismatched.
   */
  "Check Text Of Element With Normalization And Logging To File": async (
    Element: RobotValue,
    Expected_text: RobotValue
  ) => {
    let Elements_text: RobotValue,
      status: RobotValue,
      message: RobotValue,
      differences: RobotValue,
      timestamp: RobotValue,
      header: RobotValue,
      formatted_differences: RobotValue,
      content: RobotValue;
    await BuiltIn["Sleep"]("1s");
    await BuiltIn["Log"](`Element: ${str(Element)}`);
    await BuiltIn["Log"](`Expected text: ${str(Expected_text)}`);

    // Wait until the element is visible on the page
    await Browser["Wait For Elements State"](Element, "visible");

    // Retrieve the text content of the element
    Elements_text = await Browser["Get Text"](Element);
    await BuiltIn["Log"](`Retrieved text: ${str(Elements_text)}`);

    // Initial text comparison
    [status, message] = await BuiltIn["Run Keyword And Ignore Error"](
      BuiltIn["Should Be Equal"],
      Elements_text,
      Expected_text
    );

    await BuiltIn["Log"](`Initial comparison status: ${str(status)}, message: ${str(message)}`);

    // If texts match, stop execution here
    if (str(status) === "PASS") {
      await BuiltIn["Log"]("Texts match. Test passes.");
      return;
    }

    // If texts do not match, perform normalization
    await BuiltIn["Log"]("Texts do not match. Attempting normalization.");

    // Normalize the actual elements text by removing non-breaking spaces
    Elements_text = await custom_keywords["Remove Non-breaking Space"](Elements_text);

    await BuiltIn["Log"](
      `After normalization, actual text: ${str(Elements_text)}, expected text: ${str(Expected_text)}`
    );

    // Compare again after normalization
    [status, message] = await BuiltIn["Run Keyword And Ignore Error"](
      BuiltIn["Should Be Equal"],
      Elements_text,
      Expected_text
    );

    await BuiltIn["Log"](`Comparison status after normalization: ${str(status)}, message: ${str(message)}`);

    // If texts match after normalization, stop execution here
    if (str(status) === "PASS") {
      await BuiltIn["Log"]("Texts match after normalization. Test passes.");
      return;
    }

    // If texts still do not match, log the differences
    await BuiltIn["Log"]("Texts still do not match after normalization.");

    // Log differences using the Python function
    differences = await python_keywords.log_differences(Elements_text, Expected_text);

    // Get the timestamp
    timestamp = await BuiltIn["Get Time"](named({ format: "timestamp" }));

    // Create the header
    header = `Test Name: ${str(robot.TEST_NAME)}
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
    await OperatingSystem["Append To File"](`debug_${str(robot.TEST_NAME)}.txt`, content);

    // Fail the test with a descriptive message
    await BuiltIn["Fail"](
      `Texts still do not match after normalization. Differences logged to debug_${str(robot.TEST_NAME)}.txt.`
    );
  },

  /**
   * Checks element text with automatic space stripping and flexible comparison options.
   * Retries until the text matches, so slowly rendered text is waited for.
   * With return_status=True the text is checked once and True or False is returned.
   */
  "Check Elements Text": async (
    Element: RobotValue,
    Expected_text: RobotValue,
    strip_spaces: RobotValue = "True",
    ignore_case: RobotValue = "False",
    return_status: RobotValue = "False",
    message: RobotValue = null
  ) => {
    let default_msg: RobotValue, final_msg: RobotValue, status: RobotValue;
    await BuiltIn["Log"](`Element: ${str(Element)}`);
    await BuiltIn["Log"](`Expected text: ${str(Expected_text)}`);

    // Wait until the element is visible on the page
    await Browser["Wait For Elements State"](Element, "visible", named({ timeout: "10s" }));

    // Determine the error message to use
    default_msg = `Element text does not match. Element: ${str(Element)}`;
    final_msg = str(message) !== "None" ? message : default_msg;

    // Return status boolean for loops vs fail test for assertions
    if (isTruthy(return_status)) {
      status = await BuiltIn["Run Keyword And Return Status"](
        custom_keywords["Element Text Should Be"],
        Element,
        Expected_text,
        strip_spaces,
        ignore_case,
        final_msg
      );
      return status;
    }
    await BuiltIn["Wait Until Keyword Succeeds"](
      V.CONTENT_WAIT_TIMEOUT,
      "250ms",
      custom_keywords["Element Text Should Be"],
      Element,
      Expected_text,
      strip_spaces,
      ignore_case,
      final_msg
    );
  },

  "Element Text Should Be": async (
    element: RobotValue,
    expected_text: RobotValue,
    strip_spaces: RobotValue,
    ignore_case: RobotValue,
    message: RobotValue
  ) => {
    let text: RobotValue;
    text = await Browser["Get Text"](element);
    await BuiltIn["Should Be Equal"](
      text,
      expected_text,
      named({ strip_spaces: strip_spaces, ignore_case: ignore_case, msg: message })
    );
  },

  /** Checks if element text contains expected text using Should Contain */
  "Check Element Contains Text": async (
    Element: RobotValue,
    Expected_text: RobotValue,
    strip_spaces: RobotValue = "True",
    ignore_case: RobotValue = "False",
    return_status: RobotValue = "False"
  ) => {
    let Elements_text: RobotValue, status: RobotValue;
    await BuiltIn["Sleep"]("1s");
    await BuiltIn["Log"](`Element: ${str(Element)}`);
    await BuiltIn["Log"](`Expected text: ${str(Expected_text)}`);

    // Wait until the element is visible on the page
    await Browser["Wait For Elements State"](Element, "visible", named({ timeout: "10s" }));

    // Retrieve the text content of the element
    Elements_text = await Browser["Get Text"](Element);

    // Return status boolean for loops vs fail test for assertions
    if (isTruthy(return_status)) {
      status = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Contain"],
        Elements_text,
        Expected_text,
        named({
          strip_spaces: strip_spaces,
          ignore_case: ignore_case,
          msg: "Element text does not contain expected text",
        })
      );
      return status;
    }
    await BuiltIn["Should Contain"](
      Elements_text,
      Expected_text,
      named({
        strip_spaces: strip_spaces,
        ignore_case: ignore_case,
        msg: `Element text does not contain expected text. Element: ${str(Element)}`,
      })
    );

    //
    // Calendar extraction
    //
  },

  /** Converts a booking time string to ICS format with time zone information. */
  "Convert Booking Time To ICS Format": async (time_string: RobotValue) => {
    let timezone: RobotValue, ics_start: RobotValue, ics_end: RobotValue;
    // Check System Time Zone
    timezone = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    await BuiltIn["Log"](`Current system time zone is: ${str(timezone)}`);
    await BuiltIn["Log"](`This is the timeslot ${str(time_string)}`);

    // Convert booking time to ICS format using the Python function
    [ics_start, ics_end] = python_keywords.convert_booking_time_to_ics(time_string);
    await BuiltIn["Log"](`ICS Start Time: ${str(ics_start)}`);
    await BuiltIn["Log"](`ICS End Time: ${str(ics_end)}`);
    V.FORMATTED_START_TO_ICS = ics_start;
    V.FORMATTED_END_TO_ICS = ics_end;
  },

  "Extract Start And End Time From ICS File": async (text_from_ics_file: RobotValue) => {
    let dtstart_pattern: RobotValue,
      dtend_pattern: RobotValue,
      dtstart_matches: RobotValue,
      dtend_matches: RobotValue,
      start_match: RobotValue,
      end_match: RobotValue;
    // Log the ICS text for debugging
    await BuiltIn["Log"](`ICS Text: ${str(text_from_ics_file)}`);

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
      await BuiltIn["Fail"]("No DTSTART matches found in the text");
    }
    if (dtend_matches.length === 0) {
      await BuiltIn["Fail"]("No DTEND matches found in the text");
    }

    start_match = await Collections["Get From List"](dtstart_matches, "0");
    end_match = await Collections["Get From List"](dtend_matches, "0");
    await BuiltIn["Log"](`Start match: ${str(start_match)} and End match: ${str(end_match)}`);

    // Set the extracted matches as suite variables
    V.START_TIME_FROM_ICS = start_match;
    V.END_TIME_FROM_ICS = end_match;

    // Log the variables for confirmation
    await BuiltIn["Log"](`Start datetime: ${str(V.START_TIME_FROM_ICS)}`);
    await BuiltIn["Log"](`End datetime: ${str(V.END_TIME_FROM_ICS)}`);
  },

  /**
   * Checks that a given weekday's column in the calendar contains
   * an event label exactly matching the specified time.
   */
  "Verify Reservation Slot Exists": async (TIME_TO_CHECK: RobotValue, DAY_TO_CHECK: RobotValue) => {
    let normTime: RobotValue,
      days: RobotValue,
      dayIdx: RobotValue,
      labels: RobotValue,
      count: RobotValue,
      lbl: RobotValue,
      txt: RobotValue;
    // normalize search key
    normTime = await String_["Replace String"](TIME_TO_CHECK, "–", "-");
    normTime = await String_["Replace String"](normTime, "—", "-");
    normTime = await String_["Replace String"](normTime, " ", "");
    await BuiltIn["Log"](`Normalized search ➔ ${str(normTime)}`);

    // pick correct column index
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    dayIdx = await Collections["Get Index From List"](days, DAY_TO_CHECK);
    await BuiltIn["Should Be True"](Number(dayIdx) >= 0, named({ msg: `Day "${str(DAY_TO_CHECK)}" not found` }));
    await BuiltIn["Log"](`Checking column index ${str(Number(dayIdx) + 2)}`);

    labels = await Browser["Get Elements"](
      `css=.rbc-time-column:nth-child(${str(Number(dayIdx) + 2)}) .rbc-events-container .rbc-event-label`
    );
    count = await BuiltIn["Get Length"](labels);
    await BuiltIn["Log"](`Found ${str(count)} label(s) on ${str(DAY_TO_CHECK)}`);
    await BuiltIn["Should Be True"](
      Number(count) > 0,
      named({ msg: `No reservation labels found. There should be at least one ${str(DAY_TO_CHECK)}` })
    );

    // initialize found so it always exists
    V.found = false;

    for (lbl of labels) {
      txt = await Browser["Get Text"](lbl);
      txt = await String_["Replace String"](txt, "–", "-");
      txt = await String_["Replace String"](txt, "—", "-");
      txt = await String_["Replace String"](txt, " ", "");
      await BuiltIn["Log"](`Normalized label ➔ ${str(txt)}`);
      if (str(txt) === str(normTime)) {
        V.found = true;
        await BuiltIn["Log"]("Match found!");
        break;
      }
    }

    await BuiltIn["Log"](`Final result: ${str(V.found)}`);
    await BuiltIn["Should Be True"](
      isTruthy(V.found),
      named({ msg: `Reservation not found for ${str(DAY_TO_CHECK)} at ${str(TIME_TO_CHECK)}` })
    );

    //
    // Calendar extraction
    //
  },
});
