/** Port of PO/User/mybookings.robot */
import { Browser, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { DateTime, parseDate, strftime } from "../../../lib/DateTime";
import { V, chain, expect, isTruthy, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { String_ } from "../../../lib/String";
import { quick_reservation } from "../../PO/User/quick_reservation";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const mybookings = keywords("mybookings", {
  "Check My Bookings H1": async (bookingstatus: string) => {
    await Browser["Wait For Elements State"]("h1", "visible", named({ timeout: "15s" }));
    await custom_keywords["Check Elements Text"]("h1", bookingstatus);
  },

  // Cancel
  "User Cancel Booking": async () => {
    await Browser["Wait For Elements State"]("data-testid=reservation-detail__button--cancel", "visible");
    await custom_keywords["Click And Wait For Page"]("data-testid=reservation-detail__button--cancel");
  },

  "Click Reason For Cancellation": async () => {
    // Wait For Elements State  data-testid=reservation-detail__button--cancel  visible
    // Click  id=reason-toggle-button
    await Browser["Wait For Elements State"]("id=reservation-cancel__reason-label");
    await Browser["Click"]("id=reservation-cancel__reason-main-button");
  },

  "Select Reason For Cancellation": async (reason: string) => {
    // Wait For Elements State  id=reason-item-0  visible
    await custom_keywords["Find And Click Element With Text"]("li", reason);
    // An option picked within 200 ms of opening leaves the HDS Select list open over the cancel button
    await custom_keywords["Close Select List If Open"]("id=reservation-cancel__reason-main-button");
  },

  "Click Cancel Button": async () => {
    // The click waits until the button is enabled
    await custom_keywords["Click And Wait For Page"]('[data-testid="reservation-cancel__button--cancel"]');
  },

  "Check Cancel Button Is Not Found In Reservations": async () => {
    // The reservation's content is rendered with its buttons, so the check sees the page
    await expect(loc('[data-testid="reservation__content"]')).toBeVisible();
    await expect(
      loc('[data-testid="reservation-detail__button--cancel"]'),
      "Cancel button is still present"
    ).toHaveCount(0, { timeout: 3000 });
  },

  // Modify booking
  "User Click Change Time": async () => {
    let reservations_loaded: RobotValue;
    // The free times on the edit page depend on the unit's existing reservations
    reservations_loaded = await quick_reservation["Start Waiting For Reservations Query"]();
    await Browser["Click"]("data-testid=reservation-detail__button--edit");
    await quick_reservation["Wait For Reservations Query"](reservations_loaded);
  },

  // Reservations page
  "Check Reservation Status": async (reservation_status: RobotValue) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await custom_keywords["Check Elements Text"]('[data-testid="reservation__status"]', reservation_status);
  },

  "Check Reservations Payment Status": async (reservation_payment_status: RobotValue) => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__content"]', "visible");
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__payment-status"]',
      reservation_payment_status
    );
  },

  "Check Reservation Number From H1 Text": async (booking_num: RobotValue) => {
    await custom_keywords["Check Number From Text Is Equal To"](
      '[data-testid="reservation__content"] >> h1',
      booking_num
    );
  },

  "Check Number Of Participants": async (reservation_number_participants: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__numPersons"]',
      reservation_number_participants
    );
  },

  "Check Reservation Time": async (reservation_time: RobotValue) => {
    await custom_keywords["Check Elements Text"]('[data-testid="reservation__time"]', reservation_time);
  },

  "Check Reservation Description": async (reservation_description: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__description"]',
      reservation_description
    );
  },

  "Check Reservation Booker Name": async (reservation_bookerName: RobotValue) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__reservee-name"]',
      reservation_bookerName
    );
  },

  "Check Reservation Booker First Name": async (reservation_bookerFirstName: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__reserveeFirstName"]',
      reservation_bookerFirstName
    );
  },

  "Check Reservation Booker Last Name": async (reservation_bookerLastName: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__reserveeLastName"]',
      reservation_bookerLastName
    );
  },

  "Check Reservation Booker Phone": async (reservation_bookerPhone: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__reserveePhone"]',
      reservation_bookerPhone
    );
  },

  "Check Reservation Booker Email": async (reservation_bookerEmail: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__reserveeEmail"]',
      reservation_bookerEmail
    );
  },

  "Check Reservation Purpose": async (reservation_purpose: string) => {
    await custom_keywords["Check Elements Text"](
      '[data-testid="reservation__summary-fields__purpose"]',
      reservation_purpose
    );
  },

  "Check Reservation Age Group": async (age_group: string) => {
    await custom_keywords["Check Elements Text"]('[data-testid="reservation__summary-fields__ageGroup"]', age_group);
  },

  "Check Reservation Access Code": async (access_code: RobotValue) => {
    await custom_keywords["Check Element Contains Text"](
      '[data-testid="reservation__reservation-info-card__accessType"]',
      access_code
    );
  },

  // Tablist
  "Navigate To Cancelled Bookings": async () => {
    // Port: the HDS tab list slides when a tab gets focus. On mobile WebKit the slide can move the tab away between
    // mousedown and mouseup, so the click is lost and the tab is only focused, not selected. Focus first so that
    // the slide happens before the click, check that the tab got selected, and repeat a lost click.
    await BuiltIn["Wait Until Keyword Succeeds"]("3x", "500ms", async () => {
      await Browser["Focus"]("id=tab-2-button");
      await Browser["Click"]("id=tab-2-button");
      await Browser["Wait For Elements State"](
        'css=#tab-2-button[aria-selected="true"]',
        "visible",
        named({ timeout: "2s", message: "The cancelled bookings tab is not selected after the click" })
      );
    });
  },

  "Navigate To Past Bookings": async () => {
    // Port: focus before the click and check the selection, see Navigate To Cancelled Bookings
    await BuiltIn["Wait Until Keyword Succeeds"]("3x", "500ms", async () => {
      await Browser["Focus"]("id=tab-1-button");
      await Browser["Click"]("id=tab-1-button");
      await Browser["Wait For Elements State"](
        'css=#tab-1-button[aria-selected="true"]',
        "visible",
        named({ timeout: "2s", message: "The past bookings tab is not selected after the click" })
      );
    });
  },

  "Navigate To Upcoming Bookings": async () => {
    // Port: focus before the click and check the selection, see Navigate To Cancelled Bookings
    await BuiltIn["Wait Until Keyword Succeeds"]("3x", "500ms", async () => {
      await Browser["Focus"]("id=tab-0-button");
      await Browser["Click"]("id=tab-0-button");
      await Browser["Wait For Elements State"](
        'css=#tab-0-button[aria-selected="true"]',
        "visible",
        named({ timeout: "2s", message: "The upcoming bookings tab is not selected after the click" })
      );
    });
  },

  // Additional checks
  "Validate Reservations Are Not For Today Or Later": async () => {
    let today: RobotValue,
      reservations: RobotValue,
      reservation: RobotValue,
      reservation_text: RobotValue,
      date_part: RobotValue,
      date_without_weekday: RobotValue,
      converted_date_part: RobotValue;
    await BuiltIn["Log"](
      "This step assumes that there are reservations in the list. Disabling strict mode here to make sure that selector exists."
    );

    // Disable strict mode to ensure the selector can be located even if multiple matches are found
    await Browser["Set Strict Mode"]("False");
    // Wait until the reservation elements are visible on the page
    await Browser["Wait For Elements State"]('[data-testid="reservation-card__time"]', "visible");
    // Re-enable strict mode for subsequent operations
    await Browser["Set Strict Mode"]("True");

    // Get the current date in the format YYYYMMDD to use as the baseline for validation
    today = await DateTime["Get Current Date"](named({ result_format: "%Y%m%d" }));

    // Fetch all reservation elements on the page
    reservations = await Browser["Get Elements"]('[data-testid="reservation-card__time"]');

    // Loop through each reservation element
    for (reservation of reservations) {
      // Extract the text content of the reservation element
      reservation_text = await Browser["Get Text"](reservation);

      // Log the reservation details for debugging purposes
      await BuiltIn["Log"](`Processing reservation: ${str(reservation_text)}`);

      // Extract the date portion before the word "klo"
      date_part = await String_["Fetch From Left"](reservation_text, "klo");

      // Remove any leading or trailing whitespace from the extracted date
      date_part = await String_["Strip String"](date_part);

      // Remove any non-numeric characters (e.g. weekdays or symbols) from the date
      date_without_weekday = await String_["Replace String Using Regexp"](date_part, "[^0-9.]", "");

      // Convert the cleaned date into the format YYYYMMDD
      converted_date_part = strftime(parseDate(str(date_without_weekday), "%d.%m.%Y"), "%Y%m%d");

      // Log the converted date for debugging
      await BuiltIn["Log"](`Converted date: ${str(converted_date_part)}`);

      // Check if the reservation date is today or later
      if (Number(str(converted_date_part)) >= Number(str(today))) {
        await BuiltIn["Fail"](
          `Found reservation for ${str(converted_date_part)} which is greater than ${str(today)}. Reservations should not exist for the current day or any future date."`,
          "BREAK"
        );
      }
    }

    // Log a success message if no invalid reservations are found
    await BuiltIn["Log"]("Validation completed successfully: No reservations found for today or later.");
  },

  /**
   * Fails after a short wait if the list has no reservation cards at all.
   * The list is fetched once when the page opens, so a retry has to reload it.
   */
  "Wait For Reservation Cards": async () => {
    await Browser["Wait For Elements State"](
      '[data-testid="reservation-card__container"] >> nth=0',
      "visible",
      named({ timeout: V.CONTENT_WAIT_TIMEOUT, message: "No reservation cards in the list" })
    );
  },

  /** Waits until the upcoming bookings list has loaded: it shows booking cards or the empty message. */
  "Wait For Upcoming Bookings To Load": async () => {
    let card_count: RobotValue;
    await Browser["Wait For Elements State"](
      `css=[data-testid="reservation-card__container"], div:text-is("${V.MYBOOKINGS_NO_UPCOMING_FI}") >> nth=0`,
      "visible",
      named({ timeout: "15s" })
    );
    // The selector matches either one, so log which one the list shows
    card_count = await Browser["Get Element Count"]('[data-testid="reservation-card__container"]');
    await BuiltIn["Log"](`The upcoming bookings list shows ${str(card_count)} booking cards`);
  },

  /** Reloads the reservation page until it shows the payment status, which the backend updates afterwards. */
  "Wait For Payment Status": async (payment_status: string) => {
    // Port: expect(...).toPass reloads every 2 s, instead of Wait Until Keyword Succeeds
    await expect(async () => {
      await mybookings["Reload And Check Payment Status"](payment_status);
    }).toPass({ intervals: [2000], timeout: 60_000 });
  },

  "Reload And Check Payment Status": async (payment_status: RobotValue) => {
    await Browser["Reload"]();
    await expect(loc('[data-testid="reservation__payment-status"]')).toHaveText(str(payment_status), {
      useInnerText: true,
      timeout: 5000,
    });
  },

  /**
   * This keyword verifies if a reservation card with a specified unit name and reservation time is present in the list,
   * and clicks the "Show" button on the matching card if found.
   * If multiple matches exist, selects the last matching card.
   * This behavior is used to handle double matching canceled reservations
   * because we cannot clear backend data between test runs.
   */
  "Check Unitname And Reservation Time And Click Show": async (unitname: RobotValue, reservation_time: RobotValue) => {
    let containers: RobotValue,
      count: RobotValue,
      match_found: RobotValue,
      last_match_index: RobotValue,
      index: RobotValue,
      name_element: RobotValue,
      name_text: RobotValue,
      time_element_exists: RobotValue,
      time_text: RobotValue;
    await BuiltIn["Log"](
      `Starting validation for reservation card with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );

    // Log the time we got in
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_MINUS_T);
    await BuiltIn["Log"](reservation_time);

    // Retrieve all reservation card containers and log their count
    await mybookings["Wait For Reservation Cards"]();
    containers = await Browser["Get Elements"]('[data-testid="reservation-card__container"]');
    count = await BuiltIn["Get Length"](containers);
    await BuiltIn["Log"](`Found ${str(count)} reservation card containers.`);

    // Initialize variables to track the last match
    match_found = "False";
    last_match_index = "-1";

    // Loop through each reservation card container to find matches
    for (index = 0; index < Number(count); index++) {
      name_element = await Browser["Get Element"](chain(containers[index], '[data-testid="reservation-card__name"]'));
      name_text = await Browser["Get Text"](name_element);
      await BuiltIn["Log"](`Checking reservation card at index ${str(index)} with name: ${str(name_text)}`);

      // Check if the reservation time element exists within the current reservation card.
      time_element_exists = await BuiltIn["Run Keyword And Return Status"](
        Browser["Get Element"],
        chain(containers[index], '[data-testid="reservation-card__time"]')
      );
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await Browser["Get Text"](chain(containers[index], '[data-testid="reservation-card__time"]'));
      }

      // Check if both unit name and reservation time match the target values.
      if (str(name_text) === str(unitname) && str(time_text) === str(reservation_time)) {
        // Instead of immediately clicking and breaking, store this as the last match
        match_found = "True";
        last_match_index = index;
        await BuiltIn["Log"](`Found matching reservation at index ${str(index)}, continuing to look for more matches`);
      }
    }

    // After checking all containers, click the last matching one if any match was found
    if (str(match_found) === "True") {
      await BuiltIn["Log"](`Clicking the last matching reservation at index ${str(last_match_index)}`);
      await mybookings["Click Show Button"](containers[last_match_index]);
    } else {
      await BuiltIn["Fail"](
        `No match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
      );
    }

    await BuiltIn["Log"]("Completed validation for reservation card.");
  },

  "Click Show Button": async (container: RobotValue) => {
    let button_element: RobotValue;
    await BuiltIn["Log"]("Attempting to click the show button inside the container");
    button_element = await Browser["Get Element"](
      chain(container, '[data-testid="reservation-card__button--goto-reservation"]')
    );
    await custom_keywords["Click And Wait For Navigation With Retry"](
      button_element,
      '[data-testid="reservation__content"]',
      /* max_attempts= */ "2",
      /* nav_timeout= */ "20s"
    );
    await BuiltIn["Log"]("Successfully clicked the show button");
  },

  /**
   * This keyword validates that a reservation card with the specified
   * unit name and time exists and fails the test if a cancel button is present.
   */
  "Check Unitname And Reservation Time And Verify No Cancel Button": async (
    unitname: RobotValue,
    reservation_time: RobotValue
  ) => {
    let containers: RobotValue,
      count: RobotValue,
      match_found: RobotValue,
      index: RobotValue,
      name_element: RobotValue,
      name_text: RobotValue,
      time_element_exists: RobotValue,
      time_text: RobotValue,
      cancel_button_count: RobotValue;
    await BuiltIn["Log"](
      `Starting validation for reservation card with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );
    await BuiltIn["Log"](V.TIME_OF_QUICK_RESERVATION_MINUS_T);
    await BuiltIn["Log"](reservation_time);

    // DEVNOTE for testing
    // ${unitname}=  Set Variable  Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju
    // ${reservation_time}=  Set Variable  Ke 24.7.2024 klo 09:30–09:45

    // 1. Source Data Verification
    await mybookings["Wait For Reservation Cards"]();
    containers = await Browser["Get Elements"]('[data-testid="reservation-card__container"]');
    count = await BuiltIn["Get Length"](containers);
    await BuiltIn["Log"](`Found ${str(count)} reservation card containers.`);

    // Initialize a flag to track if a match is found
    match_found = "False";

    for (index = 0; index < Number(count); index++) {
      name_element = await Browser["Get Element"](chain(containers[index], '[data-testid="reservation-card__name"]'));
      name_text = await Browser["Get Text"](name_element);
      await BuiltIn["Log"](`Checking reservation card at index ${str(index)} with name: ${str(name_text)}`);

      // 2. Enhanced Logging
      time_element_exists = await BuiltIn["Run Keyword And Return Status"](
        Browser["Get Element"],
        chain(containers[index], '[data-testid="reservation-card__time"]')
      );
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await Browser["Get Text"](chain(containers[index], '[data-testid="reservation-card__time"]'));
      }

      // 3. Boundary Conditions: Ensuring time match
      // Check if both unit name and reservation time match the expected values
      // If any cancel button is found, fail the test
      if (str(name_text) === str(unitname) && str(time_text) === str(reservation_time)) {
        // Count the number of cancel buttons in the matching container
        cancel_button_count = await Browser["Get Element Count"](
          chain(containers[index], '[data-testid="reservation-card__button--cancel-reservation"]')
        );
        // If any cancel button is found, fail the test
        if (Number(cancel_button_count) > 0) {
          await BuiltIn["Fail"](
            `Cancel button is present for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
          );
        } else {
          match_found = "True";
        }
        break;
      }
    }

    // Check if no match was found, and if so, fail the test
    if (str(match_found) === "False") {
      await BuiltIn["Fail"](
        `No match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
      );
    }

    await BuiltIn["Log"]("Completed validation for reservation card.");
  },

  "Check Unitname And Reservation Are Found": async (unitname: RobotValue, reservation_time: RobotValue) => {
    let containers: RobotValue,
      count: RobotValue,
      match_found: RobotValue,
      index: RobotValue,
      name_element: RobotValue,
      name_text: RobotValue,
      time_element_exists: RobotValue,
      time_text: RobotValue,
      name_match: RobotValue,
      time_match: RobotValue;
    await BuiltIn["Log"](
      `Starting validation for reservation card with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );
    await BuiltIn["Log"](
      'This keyword uses selectors: [data-testid="reservation-card__name"] and [data-testid="reservation-card__time"]'
    );

    // Fetch all elements that match the reservation card container test ID
    containers = await Browser["Get Elements"]('[data-testid="reservation-card__container"]');
    count = await BuiltIn["Get Length"](containers);
    await BuiltIn["Log"](`Found ${str(count)} reservation card containers - Starting detailed checks.`);

    // Initialize a flag to track if a valid match is found
    match_found = "False";

    // Loop through each container to check for name and time matches
    for (index = 0; index < Number(count); index++) {
      name_element = await Browser["Get Element"](chain(containers[index], '[data-testid="reservation-card__name"]'));
      name_text = await Browser["Get Text"](name_element);
      await BuiltIn["Log"](`Checking reservation card at index ${str(index)} with name: ${str(name_text)}`);

      // Check if the time element exists and fetch its text
      time_element_exists = await BuiltIn["Run Keyword And Return Status"](
        Browser["Get Element"],
        chain(containers[index], '[data-testid="reservation-card__time"]')
      );
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await Browser["Get Text"](chain(containers[index], '[data-testid="reservation-card__time"]'));
        await BuiltIn["Log"](`Time found at index ${str(index)}: ${str(time_text)}`);
      } else {
        await BuiltIn["Log"](`No time element found at index ${str(index)}`);
      }

      // Compare the fetched name and the expected unit name
      name_match = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Be Equal As Strings"],
        name_text,
        unitname
      );
      if (isTruthy(name_match)) {
        await BuiltIn["Log"](`Name matches for unit name: ${str(unitname)}`);

        // If name matches, check the time match
        time_match = await BuiltIn["Run Keyword And Return Status"](
          BuiltIn["Should Be Equal As Strings"],
          time_text,
          reservation_time
        );
        if (isTruthy(time_match)) {
          await BuiltIn["Log"](`Match found at index ${str(index)}: ${str(unitname)} at ${str(reservation_time)}`);

          // Set the match found flag to True and break the loop
          match_found = "True";
          break;
        } else {
          await BuiltIn["Log"](
            `Time mismatch at index ${str(index)}. Expected: ${str(reservation_time)}, Found: ${str(time_text)}`
          );
        }
      } else {
        await BuiltIn["Log"](
          `Name mismatch at index ${str(index)}. Expected: ${str(unitname)}, Found: ${str(name_text)}`
        );
      }
    }

    // After the loop, check if no valid match was found
    if (str(match_found) === "False") {
      // Fail the keyword if no match was found, indicating an error or unexpected condition
      await BuiltIn["Fail"](
        `No match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
      );
    } else {
      await BuiltIn["Log"](`Successfully validated reservation for ${str(unitname)} at ${str(reservation_time)}`);
    }
    await BuiltIn["Log"]("Completed validation for reservation card.");
  },

  "Check Unitname And Reservation Are Not Found": async (unitname: RobotValue, reservation_time: RobotValue) => {
    let containers: RobotValue,
      count: RobotValue,
      match_found: RobotValue,
      index: RobotValue,
      name_element: RobotValue,
      name_text: RobotValue,
      time_element_exists: RobotValue,
      time_text: RobotValue,
      condition: RobotValue,
      condition_time: RobotValue;
    // Log the start of the validation process for ensuring the absence of specific reservation details
    await BuiltIn["Log"](
      `Starting validation for reservation card absence with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );

    // Log additional debugging information if required
    await BuiltIn["Log"](`Current reservation time being validated: ${str(V.TIME_OF_QUICK_RESERVATION_MINUS_T)}`);

    // Retrieve all reservation card containers by their test IDs and count them
    // Set a shorter timeout to avoid long waits when no elements are found
    await Browser["Set Browser Timeout"]("1.5s", named({ scope: "Test" }));
    containers = await Browser["Get Elements"]('[data-testid="reservation-card__container"]');
    count = await BuiltIn["Get Length"](containers);
    await BuiltIn["Log"](`Found ${str(count)} reservation card containers.`);
    // Restore the original timeout
    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));

    // Initialize a flag to detect any unwanted matches
    match_found = "False";

    // Loop through all container elements to check for unwanted name and time matches
    for (index = 0; index < Number(count); index++) {
      // Retrieve the element containing the reservation name from the current container
      name_element = await Browser["Get Element"](chain(containers[index], '[data-testid="reservation-card__name"]'));
      name_text = await Browser["Get Text"](name_element);

      // Check if a time element exists within the current container and retrieve its text if present
      time_element_exists = await BuiltIn["Run Keyword And Return Status"](
        Browser["Get Element"],
        chain(containers[index], '[data-testid="reservation-card__time"]')
      );
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await Browser["Get Text"](chain(containers[index], '[data-testid="reservation-card__time"]'));
      }

      // Log the name and time retrieved for debugging purposes
      await BuiltIn["Log"](`Checking reservation card: Name - ${str(name_text)}, Time - ${str(time_text)}`);

      // Check if the retrieved name matches the expected unit name (it shouldn't)
      condition = await BuiltIn["Run Keyword And Return Status"](
        BuiltIn["Should Not Be Equal As Strings"],
        name_text,
        unitname
      );
      if (str(condition) === "False") {
        // If the name matches, further check if the retrieved time also matches the expected reservation time
        condition_time = await BuiltIn["Run Keyword And Return Status"](
          BuiltIn["Should Not Be Equal As Strings"],
          time_text,
          reservation_time
        );
        if (str(condition_time) === "False") {
          // If both name and time match, log the issue and set the match_found flag to True
          await BuiltIn["Log"](`Unexpected match found: Name - ${str(name_text)}, Time - ${str(time_text)}`);
          match_found = "True";
          break; // Exit the loop as an unexpected match has been found
        }
      }
    }

    // After completing the loop, check if any matches were found
    if (str(match_found) === "True") {
      // Fail the test if a match was found, logging the details of the unexpected match
      await BuiltIn["Fail"](
        `Match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}. Test should not find them.`
      );
    }

    // Log completion of the check for the absence of the reservation card
    await BuiltIn["Log"]("Completed validation for reservation card absence.");

    // MOBILE
  },
});
