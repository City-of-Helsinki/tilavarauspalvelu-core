/** Port of PO/User/mybookings.robot */
import { DateTime, parseDate, strftime } from "../../../lib/DateTime";
import { elementsOf } from "../../../lib/locators";
import { retry } from "../../../lib/retry";
import { V, expect, isTruthy, named, str, step, timeToMs, log } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import type { RobotValue } from "../../../lib/robot";
import { String_ } from "../../../lib/String";
import { PageObject } from "../../page-object";
import type { PendingResponse } from "./quick_reservation";

export class Mybookings extends PageObject {
  @step("mybookings.Check My Bookings H1")
  async checkMyBookingsH1(bookingstatus: string) {
    await this.page.locator("h1").waitFor({ state: "visible", timeout: 15_000 });
    await this.pages.customKeywords.checkElementsText("h1", bookingstatus);
  }

  // Cancel
  @step("mybookings.User Cancel Booking")
  async userCancelBooking() {
    await this.pages.customKeywords.clickAndWaitForPage('[data-testid="reservation-detail__button--cancel"]');
  }

  @step("mybookings.Click Reason For Cancellation")
  async clickReasonForCancellation() {
    // Wait For Elements State  data-testid=reservation-detail__button--cancel  visible
    // Click  id=reason-toggle-button
    await this.page.locator("#reservation-cancel__reason-label").waitFor({ state: "visible" });
    await this.page.locator("#reservation-cancel__reason-main-button").click();
  }

  @step("mybookings.Select Reason For Cancellation")
  async selectReasonForCancellation(reason: string) {
    // Wait For Elements State  id=reason-item-0  visible
    await this.pages.customKeywords.findAndClickElementWithText("li", reason);
    // An option picked within 200 ms of opening leaves the HDS Select list open over the cancel button
    await this.pages.customKeywords.closeSelectListIfOpen("#reservation-cancel__reason-main-button");
  }

  @step("mybookings.Click Cancel Button")
  async clickCancelButton() {
    // The click waits until the button is enabled
    await this.pages.customKeywords.clickAndWaitForPage('[data-testid="reservation-cancel__button--cancel"]');
  }

  @step("mybookings.Check Cancel Button Is Not Found In Reservations")
  async checkCancelButtonIsNotFoundInReservations() {
    // The reservation's content is rendered with its buttons, so the check sees the page
    await expect(this.page.getByTestId("reservation__content")).toBeVisible();
    await expect(
      this.page.getByTestId("reservation-detail__button--cancel"),
      "Cancel button is still present"
    ).toHaveCount(0, { timeout: 3000 });
  }

  // Modify booking
  @step("mybookings.User Click Change Time")
  async userClickChangeTime() {
    let reservations_loaded: PendingResponse;
    // The free times on the edit page depend on the unit's existing reservations
    reservations_loaded = await this.pages.quickReservation.startWaitingForReservationsQuery();
    await this.page.getByTestId("reservation-detail__button--edit").click();
    await this.pages.quickReservation.waitForReservationsQuery(reservations_loaded);
  }

  // Reservations page
  @step("mybookings.Check Reservation Status")
  async checkReservationStatus(reservation_status: RobotValue) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.customKeywords.checkElementsText('[data-testid="reservation__status"]', reservation_status);
  }

  @step("mybookings.Check Reservations Payment Status")
  async checkReservationsPaymentStatus(reservation_payment_status: RobotValue) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__payment-status"]',
      reservation_payment_status
    );
  }

  @step("mybookings.Check Reservation Number From H1 Text")
  async checkReservationNumberFromH1Text(booking_num: RobotValue) {
    await this.pages.customKeywords.checkNumberFromTextIsEqualTo(
      '[data-testid="reservation__content"] >> h1',
      booking_num
    );
  }

  @step("mybookings.Check Number Of Participants")
  async checkNumberOfParticipants(reservation_number_participants: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__numPersons"]',
      reservation_number_participants
    );
  }

  @step("mybookings.Check Reservation Time")
  async checkReservationTime(reservation_time: RobotValue) {
    await this.pages.customKeywords.checkElementsText('[data-testid="reservation__time"]', reservation_time);
  }

  @step("mybookings.Check Reservation Description")
  async checkReservationDescription(reservation_description: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__description"]',
      reservation_description
    );
  }

  @step("mybookings.Check Reservation Booker Name")
  async checkReservationBookerName(reservation_bookerName: RobotValue) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__reservee-name"]',
      reservation_bookerName
    );
  }

  @step("mybookings.Check Reservation Booker First Name")
  async checkReservationBookerFirstName(reservation_bookerFirstName: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__reserveeFirstName"]',
      reservation_bookerFirstName
    );
  }

  @step("mybookings.Check Reservation Booker Last Name")
  async checkReservationBookerLastName(reservation_bookerLastName: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__reserveeLastName"]',
      reservation_bookerLastName
    );
  }

  @step("mybookings.Check Reservation Booker Phone")
  async checkReservationBookerPhone(reservation_bookerPhone: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__reserveePhone"]',
      reservation_bookerPhone
    );
  }

  @step("mybookings.Check Reservation Booker Email")
  async checkReservationBookerEmail(reservation_bookerEmail: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__reserveeEmail"]',
      reservation_bookerEmail
    );
  }

  @step("mybookings.Check Reservation Purpose")
  async checkReservationPurpose(reservation_purpose: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__purpose"]',
      reservation_purpose
    );
  }

  @step("mybookings.Check Reservation Age Group")
  async checkReservationAgeGroup(age_group: string) {
    await this.pages.customKeywords.checkElementsText(
      '[data-testid="reservation__summary-fields__ageGroup"]',
      age_group
    );
  }

  @step("mybookings.Check Reservation Access Code")
  async checkReservationAccessCode(access_code: RobotValue) {
    await this.pages.customKeywords.checkElementContainsText(
      '[data-testid="reservation__reservation-info-card__accessType"]',
      access_code
    );
  }

  // Tablist
  @step("mybookings.Navigate To Cancelled Bookings")
  async navigateToCancelledBookings() {
    // Port: the HDS tab list slides when a tab gets focus. On mobile WebKit the slide can move the tab away between
    // mousedown and mouseup, so the click is lost and the tab is only focused, not selected. Focus first so that
    // the slide happens before the click, check that the tab got selected, and repeat a lost click.
    await retry(3, 500, async () => {
      await this.page.locator("#tab-2-button").focus();
      await this.page.locator("#tab-2-button").click();
      await expect(
        this.page.locator('#tab-2-button[aria-selected="true"]'),
        "The cancelled bookings tab is not selected after the click"
      ).toBeVisible({ timeout: 2000 });
    });
  }

  @step("mybookings.Navigate To Past Bookings")
  async navigateToPastBookings() {
    // Port: focus before the click and check the selection, see Navigate To Cancelled Bookings
    await retry(3, 500, async () => {
      await this.page.locator("#tab-1-button").focus();
      await this.page.locator("#tab-1-button").click();
      await expect(
        this.page.locator('#tab-1-button[aria-selected="true"]'),
        "The past bookings tab is not selected after the click"
      ).toBeVisible({ timeout: 2000 });
    });
  }

  @step("mybookings.Navigate To Upcoming Bookings")
  async navigateToUpcomingBookings() {
    // Port: focus before the click and check the selection, see Navigate To Cancelled Bookings
    await retry(3, 500, async () => {
      await this.page.locator("#tab-0-button").focus();
      await this.page.locator("#tab-0-button").click();
      await expect(
        this.page.locator('#tab-0-button[aria-selected="true"]'),
        "The upcoming bookings tab is not selected after the click"
      ).toBeVisible({ timeout: 2000 });
    });
  }

  // Additional checks
  @step("mybookings.Validate Reservations Are Not For Today Or Later")
  async validateReservationsAreNotForTodayOrLater() {
    let today: RobotValue,
      reservations: string[],
      reservation_text: RobotValue,
      date_part: RobotValue,
      date_without_weekday: RobotValue,
      converted_date_part: RobotValue;
    await log("This step assumes that there are reservations in the list, and waits for the first of them.");

    // Wait until the reservation elements are visible on the page (the first one, as there can be many)
    await this.page.getByTestId("reservation-card__time").first().waitFor({ state: "visible" });

    // Get the current date in the format YYYYMMDD to use as the baseline for validation
    today = await DateTime["Get Current Date"](named({ result_format: "%Y%m%d" }));

    // Fetch the texts of all reservation elements on the page
    reservations = await this.page.getByTestId("reservation-card__time").allInnerTexts();

    // Loop through each reservation element
    for (reservation_text of reservations) {
      // Log the reservation details for debugging purposes
      await log(`Processing reservation: ${str(reservation_text)}`);

      // Extract the date portion before the word "klo"
      date_part = await String_["Fetch From Left"](reservation_text, "klo");

      // Remove any leading or trailing whitespace from the extracted date
      date_part = await String_["Strip String"](date_part);

      // Remove any non-numeric characters (e.g. weekdays or symbols) from the date
      date_without_weekday = await String_["Replace String Using Regexp"](date_part, "[^0-9.]", "");

      // Convert the cleaned date into the format YYYYMMDD
      converted_date_part = strftime(parseDate(str(date_without_weekday), "%d.%m.%Y"), "%Y%m%d");

      // Log the converted date for debugging
      await log(`Converted date: ${str(converted_date_part)}`);

      // Check if the reservation date is today or later
      if (Number(str(converted_date_part)) >= Number(str(today))) {
        throw new Error(
          `Found reservation for ${str(converted_date_part)} which is greater than ${str(today)}. Reservations should not exist for the current day or any future date."`
        );
      }
    }

    // Log a success message if no invalid reservations are found
    await log("Validation completed successfully: No reservations found for today or later.");
  }

  /**
   * Fails after a short wait if the list has no reservation cards at all.
   * The list is fetched once when the page opens, so a retry has to reload it.
   */
  @step("mybookings.Wait For Reservation Cards")
  async waitForReservationCards() {
    await expect(
      this.page.getByTestId("reservation-card__container").first(),
      "No reservation cards in the list"
    ).toBeVisible({ timeout: timeToMs(V.CONTENT_WAIT_TIMEOUT) });
  }

  /** Waits until the upcoming bookings list has loaded: it shows booking cards or the empty message. */
  @step("mybookings.Wait For Upcoming Bookings To Load")
  async waitForUpcomingBookingsToLoad() {
    let card_count: RobotValue;
    await this.page
      .getByTestId("reservation-card__container")
      .or(this.page.locator(`div:text-is("${V.MYBOOKINGS_NO_UPCOMING_FI}")`))
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    // The selector matches either one, so log which one the list shows
    card_count = await this.page.getByTestId("reservation-card__container").count();
    await log(`The upcoming bookings list shows ${str(card_count)} booking cards`);
  }

  /** Reloads the reservation page until it shows the payment status, which the backend updates afterwards. */
  @step("mybookings.Wait For Payment Status")
  async waitForPaymentStatus(payment_status: string) {
    // Port: expect(...).toPass reloads every 2 s, instead of Wait Until Keyword Succeeds
    await expect(async () => {
      await this.reloadAndCheckPaymentStatus(payment_status);
    }).toPass({ intervals: [2000], timeout: 60_000 });
  }

  @step("mybookings.Reload And Check Payment Status")
  async reloadAndCheckPaymentStatus(payment_status: RobotValue) {
    await this.page.reload();
    await expect(this.page.getByTestId("reservation__payment-status")).toHaveText(str(payment_status), {
      useInnerText: true,
      timeout: 5000,
    });
  }

  /**
   * This keyword verifies if a reservation card with a specified unit name and reservation time is present in the list,
   * and clicks the "Show" button on the matching card if found.
   * If multiple matches exist, selects the last matching card.
   * This behavior is used to handle double matching canceled reservations
   * because we cannot clear backend data between test runs.
   */
  @step("mybookings.Check Unitname And Reservation Time And Click Show")
  async checkUnitnameAndReservationTimeAndClickShow(unitname: RobotValue, reservation_time: RobotValue) {
    let containers: RobotValue,
      count: RobotValue,
      match_found: RobotValue,
      last_match_index: RobotValue,
      index: RobotValue,
      name_element: RobotValue,
      name_text: RobotValue,
      time_element_exists: RobotValue,
      time_text: RobotValue;
    await log(
      `Starting validation for reservation card with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );

    // Log the time we got in
    await log(V.TIME_OF_QUICK_RESERVATION_MINUS_T);
    await log(reservation_time);

    // Retrieve all reservation card containers and log their count
    await this.waitForReservationCards();
    containers = await elementsOf(this.page.getByTestId("reservation-card__container"));
    count = containers.length;
    await log(`Found ${str(count)} reservation card containers.`);

    // Initialize variables to track the last match
    match_found = "False";
    last_match_index = "-1";

    // Loop through each reservation card container to find matches
    for (index = 0; index < Number(count); index++) {
      name_element = containers[index].getByTestId("reservation-card__name");
      name_text = await name_element.innerText();
      await log(`Checking reservation card at index ${str(index)} with name: ${str(name_text)}`);

      // Check if the reservation time element exists within the current reservation card.
      // The card is rendered whole, so its time element is there or not
      time_element_exists = (await containers[index].getByTestId("reservation-card__time").count()) > 0;
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await containers[index].getByTestId("reservation-card__time").innerText();
      }

      // Check if both unit name and reservation time match the target values.
      if (str(name_text) === str(unitname) && str(time_text) === str(reservation_time)) {
        // Instead of immediately clicking and breaking, store this as the last match
        match_found = "True";
        last_match_index = index;
        await log(`Found matching reservation at index ${str(index)}, continuing to look for more matches`);
      }
    }

    // After checking all containers, click the last matching one if any match was found
    if (str(match_found) === "True") {
      await log(`Clicking the last matching reservation at index ${str(last_match_index)}`);
      await this.clickShowButton(containers[last_match_index]);
    } else {
      throw new Error(`No match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`);
    }

    await log("Completed validation for reservation card.");
  }

  @step("mybookings.Click Show Button")
  async clickShowButton(container: RobotValue) {
    let button_element: RobotValue;
    await log("Attempting to click the show button inside the container");
    button_element = container.getByTestId("reservation-card__button--goto-reservation");
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      button_element,
      '[data-testid="reservation__content"]',
      /* max_attempts= */ "2",
      /* nav_timeout= */ "20s"
    );
    await log("Successfully clicked the show button");
  }

  /**
   * This keyword validates that a reservation card with the specified
   * unit name and time exists and fails the test if a cancel button is present.
   */
  @step("mybookings.Check Unitname And Reservation Time And Verify No Cancel Button")
  async checkUnitnameAndReservationTimeAndVerifyNoCancelButton(unitname: RobotValue, reservation_time: RobotValue) {
    let containers: RobotValue,
      count: RobotValue,
      match_found: RobotValue,
      index: RobotValue,
      name_element: RobotValue,
      name_text: RobotValue,
      time_element_exists: RobotValue,
      time_text: RobotValue,
      cancel_button_count: RobotValue;
    await log(
      `Starting validation for reservation card with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );
    await log(V.TIME_OF_QUICK_RESERVATION_MINUS_T);
    await log(reservation_time);

    // DEVNOTE for testing
    // ${unitname}=  Set Variable  Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju
    // ${reservation_time}=  Set Variable  Ke 24.7.2024 klo 09:30–09:45

    // 1. Source Data Verification
    await this.waitForReservationCards();
    containers = await elementsOf(this.page.getByTestId("reservation-card__container"));
    count = containers.length;
    await log(`Found ${str(count)} reservation card containers.`);

    // Initialize a flag to track if a match is found
    match_found = "False";

    for (index = 0; index < Number(count); index++) {
      name_element = containers[index].getByTestId("reservation-card__name");
      name_text = await name_element.innerText();
      await log(`Checking reservation card at index ${str(index)} with name: ${str(name_text)}`);

      // 2. Enhanced Logging
      // The card is rendered whole, so its time element is there or not
      time_element_exists = (await containers[index].getByTestId("reservation-card__time").count()) > 0;
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await containers[index].getByTestId("reservation-card__time").innerText();
      }

      // 3. Boundary Conditions: Ensuring time match
      // Check if both unit name and reservation time match the expected values
      // If any cancel button is found, fail the test
      if (str(name_text) === str(unitname) && str(time_text) === str(reservation_time)) {
        // Count the number of cancel buttons in the matching container
        cancel_button_count = await containers[index]
          .getByTestId("reservation-card__button--cancel-reservation")
          .count();
        // If any cancel button is found, fail the test
        if (Number(cancel_button_count) > 0) {
          throw new Error(
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
      throw new Error(`No match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`);
    }

    await log("Completed validation for reservation card.");
  }

  @step("mybookings.Check Unitname And Reservation Are Found")
  async checkUnitnameAndReservationAreFound(unitname: RobotValue, reservation_time: RobotValue) {
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
    await log(
      `Starting validation for reservation card with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );
    await log(
      'This keyword uses selectors: [data-testid="reservation-card__name"] and [data-testid="reservation-card__time"]'
    );

    // Fetch all elements that match the reservation card container test ID
    containers = await elementsOf(this.page.getByTestId("reservation-card__container"));
    count = containers.length;
    await log(`Found ${str(count)} reservation card containers - Starting detailed checks.`);

    // Initialize a flag to track if a valid match is found
    match_found = "False";

    // Loop through each container to check for name and time matches
    for (index = 0; index < Number(count); index++) {
      name_element = containers[index].getByTestId("reservation-card__name");
      name_text = await name_element.innerText();
      await log(`Checking reservation card at index ${str(index)} with name: ${str(name_text)}`);

      // Check if the time element exists and fetch its text
      // The card is rendered whole, so its time element is there or not
      time_element_exists = (await containers[index].getByTestId("reservation-card__time").count()) > 0;
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await containers[index].getByTestId("reservation-card__time").innerText();
        await log(`Time found at index ${str(index)}: ${str(time_text)}`);
      } else {
        await log(`No time element found at index ${str(index)}`);
      }

      // Compare the fetched name and the expected unit name
      name_match = str(name_text) === str(unitname);
      if (isTruthy(name_match)) {
        await log(`Name matches for unit name: ${str(unitname)}`);

        // If name matches, check the time match
        time_match = str(time_text) === str(reservation_time);
        if (isTruthy(time_match)) {
          await log(`Match found at index ${str(index)}: ${str(unitname)} at ${str(reservation_time)}`);

          // Set the match found flag to True and break the loop
          match_found = "True";
          break;
        } else {
          await log(
            `Time mismatch at index ${str(index)}. Expected: ${str(reservation_time)}, Found: ${str(time_text)}`
          );
        }
      } else {
        await log(`Name mismatch at index ${str(index)}. Expected: ${str(unitname)}, Found: ${str(name_text)}`);
      }
    }

    // After the loop, check if no valid match was found
    if (str(match_found) === "False") {
      // Fail the keyword if no match was found, indicating an error or unexpected condition
      throw new Error(`No match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`);
    } else {
      await log(`Successfully validated reservation for ${str(unitname)} at ${str(reservation_time)}`);
    }
    await log("Completed validation for reservation card.");
  }

  @step("mybookings.Check Unitname And Reservation Are Not Found")
  async checkUnitnameAndReservationAreNotFound(unitname: RobotValue, reservation_time: RobotValue) {
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
    await log(
      `Starting validation for reservation card absence with unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}`
    );

    // Log additional debugging information if required
    await log(`Current reservation time being validated: ${str(V.TIME_OF_QUICK_RESERVATION_MINUS_T)}`);

    // Retrieve all reservation card containers by their test IDs and count them
    // A shorter timeout avoids long waits when no elements are found
    containers = await elementsOf(this.page.getByTestId("reservation-card__container"), 1500);
    count = containers.length;
    await log(`Found ${str(count)} reservation card containers.`);

    // Initialize a flag to detect any unwanted matches
    match_found = "False";

    // Loop through all container elements to check for unwanted name and time matches
    for (index = 0; index < Number(count); index++) {
      // Retrieve the element containing the reservation name from the current container
      name_element = containers[index].getByTestId("reservation-card__name");
      name_text = await name_element.innerText();

      // Check if a time element exists within the current container and retrieve its text if present
      // The card is rendered whole, so its time element is there or not
      time_element_exists = (await containers[index].getByTestId("reservation-card__time").count()) > 0;
      time_text = "NONE";
      if (isTruthy(time_element_exists)) {
        time_text = await containers[index].getByTestId("reservation-card__time").innerText();
      }

      // Log the name and time retrieved for debugging purposes
      await log(`Checking reservation card: Name - ${str(name_text)}, Time - ${str(time_text)}`);

      // Check if the retrieved name matches the expected unit name (it shouldn't)
      condition = str(name_text) !== str(unitname);
      if (str(condition) === "False") {
        // If the name matches, further check if the retrieved time also matches the expected reservation time
        condition_time = str(time_text) !== str(reservation_time);
        if (str(condition_time) === "False") {
          // If both name and time match, log the issue and set the match_found flag to True
          await log(`Unexpected match found: Name - ${str(name_text)}, Time - ${str(time_text)}`);
          match_found = "True";
          break; // Exit the loop as an unexpected match has been found
        }
      }
    }

    // After completing the loop, check if any matches were found
    if (str(match_found) === "True") {
      // Fail the test if a match was found, logging the details of the unexpected match
      throw new Error(
        `Match found for unit name: ${str(unitname)} and reservation time: ${str(reservation_time)}. Test should not find them.`
      );
    }

    // Log completion of the check for the absence of the reservation card
    await log("Completed validation for reservation card absence.");

    // MOBILE
  }
}
