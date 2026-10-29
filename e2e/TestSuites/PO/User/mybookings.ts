/** Port of PO/User/mybookings.robot */
import type { Locator } from "@playwright/test";
import { elementsOf } from "../../../lib/locators";
import { retry } from "../../../lib/retry";
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { python_keywords } from "../../Resources/python_keywords";
import { MYBOOKINGS_NO_UPCOMING_FI } from "../../Resources/texts_FI";
import { CONTENT_WAIT_TIMEOUT } from "../../Resources/variables";
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
    await this.pages.customKeywords.clickAndWaitForPage(this.page.getByTestId("reservation-detail__button--cancel"));
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
    await this.pages.customKeywords.clickAndWaitForPage(this.page.getByTestId("reservation-cancel__button--cancel"));
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
    // The free times on the edit page depend on the unit's existing reservations
    const reservations_loaded: PendingResponse = await this.pages.quickReservation.startWaitingForReservationsQuery();
    await this.page.getByTestId("reservation-detail__button--edit").click();
    await this.pages.quickReservation.waitForReservationsQuery(reservations_loaded);
  }

  // Reservations page
  @step("mybookings.Check Reservation Status")
  async checkReservationStatus(reservation_status: string) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.customKeywords.checkElementsText(this.page.getByTestId("reservation__status"), reservation_status);
  }

  @step("mybookings.Check Reservations Payment Status")
  async checkReservationsPaymentStatus(reservation_payment_status: string) {
    await this.page.getByTestId("reservation__content").waitFor({ state: "visible" });
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__payment-status"),
      reservation_payment_status
    );
  }

  @step("mybookings.Check Reservation Number From H1 Text")
  async checkReservationNumberFromH1Text(booking_num: string) {
    await this.pages.customKeywords.checkNumberFromTextIsEqualTo(
      this.page.getByTestId("reservation__content").locator("h1"),
      booking_num
    );
  }

  @step("mybookings.Check Number Of Participants")
  async checkNumberOfParticipants(reservation_number_participants: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__numPersons"),
      reservation_number_participants
    );
  }

  @step("mybookings.Check Reservation Time")
  async checkReservationTime(reservation_time: string) {
    await this.pages.customKeywords.checkElementsText(this.page.getByTestId("reservation__time"), reservation_time);
  }

  @step("mybookings.Check Reservation Description")
  async checkReservationDescription(reservation_description: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__description"),
      reservation_description
    );
  }

  @step("mybookings.Check Reservation Booker Name")
  async checkReservationBookerName(reservation_bookerName: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__reservee-name"),
      reservation_bookerName
    );
  }

  @step("mybookings.Check Reservation Booker First Name")
  async checkReservationBookerFirstName(reservation_bookerFirstName: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__reserveeFirstName"),
      reservation_bookerFirstName
    );
  }

  @step("mybookings.Check Reservation Booker Last Name")
  async checkReservationBookerLastName(reservation_bookerLastName: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__reserveeLastName"),
      reservation_bookerLastName
    );
  }

  @step("mybookings.Check Reservation Booker Phone")
  async checkReservationBookerPhone(reservation_bookerPhone: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__reserveePhone"),
      reservation_bookerPhone
    );
  }

  @step("mybookings.Check Reservation Booker Email")
  async checkReservationBookerEmail(reservation_bookerEmail: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__reserveeEmail"),
      reservation_bookerEmail
    );
  }

  @step("mybookings.Check Reservation Purpose")
  async checkReservationPurpose(reservation_purpose: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__purpose"),
      reservation_purpose
    );
  }

  @step("mybookings.Check Reservation Age Group")
  async checkReservationAgeGroup(age_group: string) {
    await this.pages.customKeywords.checkElementsText(
      this.page.getByTestId("reservation__summary-fields__ageGroup"),
      age_group
    );
  }

  @step("mybookings.Check Reservation Access Code")
  async checkReservationAccessCode(access_code: string) {
    await this.pages.customKeywords.checkElementContainsText(
      this.page.getByTestId("reservation__reservation-info-card__accessType"),
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
    await log("This step assumes that there are reservations in the list, and waits for the first of them.");

    // Wait until the reservation elements are visible on the page (the first one, as there can be many)
    await this.page.getByTestId("reservation-card__time").first().waitFor({ state: "visible" });

    // Get the current date in the format YYYYMMDD to use as the baseline for validation
    const now = new Date();
    const today = python_keywords.format_date_to_ics(`${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`);

    // Fetch the texts of all reservation elements on the page
    const reservations = await this.page.getByTestId("reservation-card__time").allInnerTexts();

    // Loop through each reservation element
    for (const reservation_text of reservations) {
      // Log the reservation details for debugging purposes
      await log(`Processing reservation: ${reservation_text}`);

      // Extract the date portion before the word "klo"
      // Remove any leading or trailing whitespace from the extracted date
      const date_part = (reservation_text.split("klo")[0] ?? "").trim();

      // Remove any non-numeric characters (e.g. weekdays or symbols) from the date
      const date_without_weekday = date_part.replaceAll(/[^0-9.]/g, "");

      // Convert the cleaned date into the format YYYYMMDD
      const converted_date_part = python_keywords.format_date_to_ics(date_without_weekday);

      // Log the converted date for debugging
      await log(`Converted date: ${converted_date_part}`);

      // Check if the reservation date is today or later
      if (Number(converted_date_part) >= Number(today)) {
        throw new Error(
          `Found reservation for ${converted_date_part} which is greater than ${today}. Reservations should not exist for the current day or any future date."`
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
    ).toBeVisible({ timeout: CONTENT_WAIT_TIMEOUT });
  }

  /** Waits until the upcoming bookings list has loaded: it shows booking cards or the empty message. */
  @step("mybookings.Wait For Upcoming Bookings To Load")
  async waitForUpcomingBookingsToLoad() {
    await this.page
      .getByTestId("reservation-card__container")
      .or(this.page.locator(`div:text-is("${MYBOOKINGS_NO_UPCOMING_FI}")`))
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    // The selector matches either one, so log which one the list shows
    const card_count = await this.page.getByTestId("reservation-card__container").count();
    await log(`The upcoming bookings list shows ${card_count} booking cards`);
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
  async reloadAndCheckPaymentStatus(payment_status: string) {
    await this.page.reload();
    await expect(this.page.getByTestId("reservation__payment-status")).toHaveText(payment_status, {
      useInnerText: true,
      timeout: 5000,
    });
  }

  /** The name and time of a reservation card. A card is rendered whole, so its time element is there or not. */
  private async cardNameAndTime(container: Locator): Promise<{ name_text: string; time_text: string | null }> {
    const name_text = await container.getByTestId("reservation-card__name").innerText();
    const time_element = container.getByTestId("reservation-card__time");
    const time_text = (await time_element.count()) > 0 ? await time_element.innerText() : null;
    return { name_text, time_text };
  }

  /**
   * This keyword verifies if a reservation card with a specified unit name and reservation time is present in the list,
   * and clicks the "Show" button on the matching card if found.
   * If multiple matches exist, selects the last matching card.
   * This behavior is used to handle double matching canceled reservations
   * because we cannot clear backend data between test runs.
   */
  @step("mybookings.Check Unitname And Reservation Time And Click Show")
  async checkUnitnameAndReservationTimeAndClickShow(unitname: string, reservation_time: string) {
    await log(
      `Starting validation for reservation card with unit name: ${unitname} and reservation time: ${reservation_time}`
    );

    // Log the time we got in
    await log(this.state.timeOfQuickReservationMinusT);
    await log(reservation_time);

    // Retrieve all reservation card containers and log their count
    await this.waitForReservationCards();
    const containers = await elementsOf(this.page.getByTestId("reservation-card__container"));
    await log(`Found ${containers.length} reservation card containers.`);

    // Track the last match
    let last_match: Locator | null = null;

    // Loop through each reservation card container to find matches
    for (const [index, container] of containers.entries()) {
      // Check if the reservation time element exists within the current reservation card.
      const { name_text, time_text } = await this.cardNameAndTime(container);
      await log(`Checking reservation card at index ${index} with name: ${name_text}`);

      // Check if both unit name and reservation time match the target values.
      if (name_text === unitname && time_text === reservation_time) {
        // Instead of immediately clicking and breaking, store this as the last match
        last_match = container;
        await log(`Found matching reservation at index ${index}, continuing to look for more matches`);
      }
    }

    // After checking all containers, click the last matching one if any match was found
    if (last_match == null) {
      throw new Error(`No match found for unit name: ${unitname} and reservation time: ${reservation_time}`);
    }
    await log(`Clicking the last matching reservation at index ${containers.indexOf(last_match)}`);
    await this.clickShowButton(last_match);

    await log("Completed validation for reservation card.");
  }

  @step("mybookings.Click Show Button")
  async clickShowButton(container: Locator) {
    await log("Attempting to click the show button inside the container");
    const button_element = container.getByTestId("reservation-card__button--goto-reservation");
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      button_element,
      this.page.getByTestId("reservation__content"),
      /* max_attempts= */ 2,
      /* nav_timeout= */ 20_000
    );
    await log("Successfully clicked the show button");
  }

  /**
   * This keyword validates that a reservation card with the specified
   * unit name and time exists and fails the test if a cancel button is present.
   */
  @step("mybookings.Check Unitname And Reservation Time And Verify No Cancel Button")
  async checkUnitnameAndReservationTimeAndVerifyNoCancelButton(unitname: string, reservation_time: string) {
    await log(
      `Starting validation for reservation card with unit name: ${unitname} and reservation time: ${reservation_time}`
    );
    await log(this.state.timeOfQuickReservationMinusT);
    await log(reservation_time);

    // DEVNOTE for testing
    // ${unitname}=  Set Variable  Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju
    // ${reservation_time}=  Set Variable  Ke 24.7.2024 klo 09:30–09:45

    // 1. Source Data Verification
    await this.waitForReservationCards();
    const containers = await elementsOf(this.page.getByTestId("reservation-card__container"));
    await log(`Found ${containers.length} reservation card containers.`);

    for (const [index, container] of containers.entries()) {
      // 2. Enhanced Logging
      const { name_text, time_text } = await this.cardNameAndTime(container);
      await log(`Checking reservation card at index ${index} with name: ${name_text}`);

      // 3. Boundary Conditions: Ensuring time match
      // Check if both unit name and reservation time match the expected values
      if (name_text === unitname && time_text === reservation_time) {
        // Count the number of cancel buttons in the matching container
        const cancel_button_count = await container.getByTestId("reservation-card__button--cancel-reservation").count();
        // If any cancel button is found, fail the test
        if (cancel_button_count > 0) {
          throw new Error(
            `Cancel button is present for unit name: ${unitname} and reservation time: ${reservation_time}`
          );
        }
        await log("Completed validation for reservation card.");
        return;
      }
    }

    // No match was found, so fail the test
    throw new Error(`No match found for unit name: ${unitname} and reservation time: ${reservation_time}`);
  }

  @step("mybookings.Check Unitname And Reservation Are Found")
  async checkUnitnameAndReservationAreFound(unitname: string, reservation_time: string) {
    await log(
      `Starting validation for reservation card with unit name: ${unitname} and reservation time: ${reservation_time}`
    );
    await log(
      'This keyword uses selectors: [data-testid="reservation-card__name"] and [data-testid="reservation-card__time"]'
    );

    // Fetch all elements that match the reservation card container test ID
    const containers = await elementsOf(this.page.getByTestId("reservation-card__container"));
    await log(`Found ${containers.length} reservation card containers - Starting detailed checks.`);

    // Loop through each container to check for name and time matches
    let match_found = false;
    for (const [index, container] of containers.entries()) {
      // Check if the time element exists and fetch its text
      const { name_text, time_text } = await this.cardNameAndTime(container);
      await log(`Checking reservation card at index ${index} with name: ${name_text}`);
      await log(
        time_text == null ? `No time element found at index ${index}` : `Time found at index ${index}: ${time_text}`
      );

      // Compare the fetched name and the expected unit name
      if (name_text === unitname) {
        await log(`Name matches for unit name: ${unitname}`);

        // If name matches, check the time match
        if (time_text === reservation_time) {
          await log(`Match found at index ${index}: ${unitname} at ${reservation_time}`);

          // Set the match found flag and break the loop
          match_found = true;
          break;
        } else {
          await log(`Time mismatch at index ${index}. Expected: ${reservation_time}, Found: ${time_text ?? "NONE"}`);
        }
      } else {
        await log(`Name mismatch at index ${index}. Expected: ${unitname}, Found: ${name_text}`);
      }
    }

    // After the loop, check if no valid match was found
    if (!match_found) {
      // Fail the keyword if no match was found, indicating an error or unexpected condition
      throw new Error(`No match found for unit name: ${unitname} and reservation time: ${reservation_time}`);
    }
    await log(`Successfully validated reservation for ${unitname} at ${reservation_time}`);
    await log("Completed validation for reservation card.");
  }

  @step("mybookings.Check Unitname And Reservation Are Not Found")
  async checkUnitnameAndReservationAreNotFound(unitname: string, reservation_time: string) {
    // Log the start of the validation process for ensuring the absence of specific reservation details
    await log(
      `Starting validation for reservation card absence with unit name: ${unitname} and reservation time: ${reservation_time}`
    );

    // Log additional debugging information if required
    await log(`Current reservation time being validated: ${this.state.timeOfQuickReservationMinusT}`);

    // Retrieve all reservation card containers by their test IDs and count them
    // A shorter timeout avoids long waits when no elements are found
    const containers = await elementsOf(this.page.getByTestId("reservation-card__container"), 1500);
    await log(`Found ${containers.length} reservation card containers.`);

    // Loop through all container elements to check for unwanted name and time matches
    for (const container of containers) {
      // Retrieve the reservation name, and the time if the container has one
      const { name_text, time_text } = await this.cardNameAndTime(container);

      // Log the name and time retrieved for debugging purposes
      await log(`Checking reservation card: Name - ${name_text}, Time - ${time_text ?? "NONE"}`);

      // If both name and time match the expected ones (they shouldn't), fail the test
      if (name_text === unitname && time_text === reservation_time) {
        await log(`Unexpected match found: Name - ${name_text}, Time - ${time_text}`);
        throw new Error(
          `Match found for unit name: ${unitname} and reservation time: ${reservation_time}. Test should not find them.`
        );
      }
    }

    // Log completion of the check for the absence of the reservation card
    await log("Completed validation for reservation card absence.");

    // MOBILE
  }
}
