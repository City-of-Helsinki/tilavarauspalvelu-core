import type { Locator } from "@playwright/test";
import { retry } from "../../../lib/retry";
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { python_keywords } from "../../Resources/python_keywords";
import { MYBOOKINGS_NO_UPCOMING_FI } from "../../Resources/texts_FI";
import { CONTENT_WAIT_TIMEOUT, TEXT_CHECK_TIMEOUT } from "../../Resources/variables";
import type { PendingResponse } from "./quick_reservation";

/** My bookings: the booking lists, and a booking's page with cancelling and changing the time. */
export class Mybookings extends PageObject {
  /** The reservation page's content */
  private get reservationContent() {
    return this.page.getByTestId("reservation__content");
  }

  @step("mybookings.Check My Bookings H1")
  async checkMyBookingsH1(bookingstatus: string) {
    await expect(this.page.locator("h1")).toHaveText(bookingstatus, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
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
    await this.page.getByRole("option", { name: reason, exact: true }).click();
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
    await expect(this.reservationContent).toBeVisible();
    await expect(
      this.page.getByTestId("reservation-detail__button--cancel"),
      "The reservation has no cancel button"
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
    // Kept on purpose: after a cancellation the page loads again, and the status check alone waits only 20 s
    await this.reservationContent.waitFor({ state: "visible" });
    await expect(this.page.getByTestId("reservation__status")).toHaveText(reservation_status, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("mybookings.Check Reservations Payment Status")
  async checkReservationsPaymentStatus(reservation_payment_status: string) {
    await this.reservationContent.waitFor({ state: "visible" });
    await expect(this.page.getByTestId("reservation__payment-status")).toHaveText(reservation_payment_status, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("mybookings.Check Reservation Number From H1 Text")
  async checkReservationNumberFromH1Text(booking_num: string) {
    await this.pages.customKeywords.checkNumberFromTextIsEqualTo(this.reservationContent.locator("h1"), booking_num);
  }

  @step("mybookings.Check Number Of Participants")
  async checkNumberOfParticipants(reservation_number_participants: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__numPersons")).toHaveText(
      reservation_number_participants,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Time")
  async checkReservationTime(reservation_time: string) {
    await expect(this.page.getByTestId("reservation__time")).toHaveText(reservation_time, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("mybookings.Check Reservation Description")
  async checkReservationDescription(reservation_description: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__description")).toHaveText(
      reservation_description,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Booker Name")
  async checkReservationBookerName(reservation_bookerName: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__reservee-name")).toHaveText(
      reservation_bookerName,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Booker First Name")
  async checkReservationBookerFirstName(reservation_bookerFirstName: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeFirstName")).toHaveText(
      reservation_bookerFirstName,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Booker Last Name")
  async checkReservationBookerLastName(reservation_bookerLastName: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeLastName")).toHaveText(
      reservation_bookerLastName,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Booker Phone")
  async checkReservationBookerPhone(reservation_bookerPhone: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__reserveePhone")).toHaveText(
      reservation_bookerPhone,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Booker Email")
  async checkReservationBookerEmail(reservation_bookerEmail: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__reserveeEmail")).toHaveText(
      reservation_bookerEmail,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("mybookings.Check Reservation Purpose")
  async checkReservationPurpose(reservation_purpose: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__purpose")).toHaveText(reservation_purpose, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("mybookings.Check Reservation Age Group")
  async checkReservationAgeGroup(age_group: string) {
    await expect(this.page.getByTestId("reservation__summary-fields__ageGroup")).toHaveText(age_group, {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }

  @step("mybookings.Check Reservation Access Code")
  async checkReservationAccessCode(access_code: string) {
    await expect(this.page.getByTestId("reservation__reservation-info-card__accessType")).toContainText(access_code, {
      useInnerText: true,
    });
  }

  // Tablist
  @step("mybookings.Navigate To Cancelled Bookings")
  async navigateToCancelledBookings() {
    // The HDS tab list slides when a tab gets focus. On mobile WebKit the slide can move the tab away between
    // mousedown and mouseup, so the click is lost and the tab is only focused, not selected. Focus first so that
    // the slide happens before the click, check that the tab got selected, and repeat a lost click.
    await retry(3, 500, async () => {
      await this.page.locator("#tab-2-button").focus();
      await this.page.locator("#tab-2-button").click();
      await expect(this.page.locator("#tab-2-button"), "The cancelled bookings tab is selected").toHaveAttribute(
        "aria-selected",
        "true",
        { timeout: 2000 }
      );
    });
  }

  @step("mybookings.Navigate To Past Bookings")
  async navigateToPastBookings() {
    // Focus before the click and check the selection, see Navigate To Cancelled Bookings
    await retry(3, 500, async () => {
      await this.page.locator("#tab-1-button").focus();
      await this.page.locator("#tab-1-button").click();
      await expect(this.page.locator("#tab-1-button"), "The past bookings tab is selected").toHaveAttribute(
        "aria-selected",
        "true",
        { timeout: 2000 }
      );
    });
  }

  @step("mybookings.Navigate To Upcoming Bookings")
  async navigateToUpcomingBookings() {
    // Focus before the click and check the selection, see Navigate To Cancelled Bookings
    await retry(3, 500, async () => {
      await this.page.locator("#tab-0-button").focus();
      await this.page.locator("#tab-0-button").click();
      await expect(this.page.locator("#tab-0-button"), "The upcoming bookings tab is selected").toHaveAttribute(
        "aria-selected",
        "true",
        { timeout: 2000 }
      );
    });
  }

  // Additional checks
  @step("mybookings.Validate Reservations Are Not For Today Or Later")
  async validateReservationsAreNotForTodayOrLater() {
    await log("This step assumes that there are reservations in the list, and waits for the first of them.", {
      level: "DEBUG",
    });

    // Wait until the reservation elements are visible on the page (the first one, as there can be many)
    await this.page.getByTestId("reservation-card__time").first().waitFor({ state: "visible" });

    // Get the current date in the format YYYYMMDD to use as the baseline for validation
    const now = new Date();
    const today = python_keywords.format_date_to_ics(`${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`);

    // Fetch the texts of all reservation elements on the page
    const reservations = await this.page.getByTestId("reservation-card__time").allInnerTexts();

    // Loop through each reservation element
    for (const reservation_text of reservations) {
      // Extract the date portion before the word "klo"
      // Remove any leading or trailing whitespace from the extracted date
      const date_part = (reservation_text.split("klo")[0] ?? "").trim();

      // Remove any non-numeric characters (e.g. weekdays or symbols) from the date
      const date_without_weekday = date_part.replaceAll(/[^0-9.]/g, "");

      // Convert the cleaned date into the format YYYYMMDD
      const converted_date_part = python_keywords.format_date_to_ics(date_without_weekday);

      // Check if the reservation date is today or later
      if (Number(converted_date_part) >= Number(today)) {
        throw new Error(
          `Found reservation for ${converted_date_part} which is greater than ${today}. Reservations should not exist for the current day or any future date."`
        );
      }
    }

    // Log a success message if no invalid reservations are found
    await log("Validation completed successfully: No reservations found for today or later.", { level: "DEBUG" });
  }

  /**
   * Fails after a short wait if the list has no reservation cards at all.
   * The list is fetched once when the page opens, so a retry has to reload it.
   */
  @step("mybookings.Wait For Reservation Cards")
  async waitForReservationCards() {
    await expect(
      this.page.getByTestId("reservation-card__container").first(),
      "The list has reservation cards"
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
    // Reloads every 2 s until the page shows the status
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

  /** The reservation cards whose name and time elements have exactly these texts. */
  private reservationCards(unitname: string, reservation_time: string): Locator {
    return this.page
      .getByTestId("reservation-card__container")
      .filter({
        has: this.page.getByTestId("reservation-card__name").and(this.page.getByText(unitname, { exact: true })),
      })
      .filter({
        has: this.page
          .getByTestId("reservation-card__time")
          .and(this.page.getByText(reservation_time, { exact: true })),
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
  async checkUnitnameAndReservationTimeAndClickShow(unitname: string, reservation_time: string) {
    await this.waitForReservationCards();
    const cards = this.reservationCards(unitname, reservation_time);
    await expect(cards.last(), `The list has a booking of ${unitname} at ${reservation_time}`).toBeVisible();
    await log(`Found ${await cards.count()} matching reservation cards, clicking the last one`);
    await this.clickShowButton(cards.last());
  }

  @step("mybookings.Click Show Button")
  async clickShowButton(container: Locator) {
    const button_element = container.getByTestId("reservation-card__button--goto-reservation");
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      button_element,
      this.reservationContent,
      /* max_attempts= */ 2,
      /* nav_timeout= */ 20_000
    );
  }

  /**
   * This keyword validates that a reservation card with the specified
   * unit name and time exists and fails the test if a cancel button is present.
   */
  @step("mybookings.Check Unitname And Reservation Time And Verify No Cancel Button")
  async checkUnitnameAndReservationTimeAndVerifyNoCancelButton(unitname: string, reservation_time: string) {
    // DEVNOTE for testing
    // ${unitname}=  Set Variable  Aina maksullinen Aitio (AUTOMAATIOTESTI ÄLÄ POISTA), Harakka, piilokoju
    // ${reservation_time}=  Set Variable  Ke 24.7.2024 klo 09:30–09:45

    await this.waitForReservationCards();
    // The first matching card. A card is rendered whole, so its buttons are there or not.
    const card = this.reservationCards(unitname, reservation_time).first();
    await expect(card, `The list has a booking of ${unitname} at ${reservation_time}`).toBeVisible();
    await expect(
      card.getByTestId("reservation-card__button--cancel-reservation"),
      `The booking of ${unitname} at ${reservation_time} has no cancel button`
    ).toHaveCount(0);
  }

  @step("mybookings.Check Unitname And Reservation Are Found")
  async checkUnitnameAndReservationAreFound(unitname: string, reservation_time: string) {
    await expect(
      this.reservationCards(unitname, reservation_time).first(),
      `The list has a booking of ${unitname} at ${reservation_time}`
    ).toBeVisible();
  }

  @step("mybookings.Check Unitname And Reservation Are Not Found")
  async checkUnitnameAndReservationAreNotFound(unitname: string, reservation_time: string) {
    // The callers open the list just before, and Navigate To My Bookings waits until the list has loaded
    await expect(
      this.reservationCards(unitname, reservation_time),
      `The list has no booking of ${unitname} at ${reservation_time}`
    ).toHaveCount(0);

    // MOBILE
  }
}
