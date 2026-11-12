import type { Response } from "@playwright/test";
import { graphqlErrorsIn } from "../../../lib/responses";
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { CONTENT_WAIT_TIMEOUT } from "../../Resources/variables";

/** A response that a keyword started waiting for. In an object, because a keyword would wait for a returned promise. */
export interface PendingResponse {
  response: Promise<Response>;
}

/** Quick reservation on a unit's page, and the booking's info card. */
export class QuickReservation extends PageObject {
  /**
   * Selects a random reservation slot from the available slots of quick reservation, and returns the slot's time,
   * e.g. 12:15.
   */
  @step("quick_reservation.Select The Free Slot From Quick Reservation")
  async selectTheFreeSlotFromQuickReservation() {
    // DEVNOTE
    // This keyword/test cannot be run over midnight
    // Example -> Su 1.10.2023 klo 23:45-0:45, 1 t != La 30.9.2023 klo 23:45-su 1.10.20230:45, 1 t

    const slots = this.page.locator('[class*="slide-visible"]').getByTestId("quick-reservation__slot");
    // The carousel can move when its slots change, wait until it shows slots and has stopped
    await expect(slots.first(), "Quick reservation shows free slots").toBeVisible();
    // Locators can't wait for an element to stop moving, its element handle can
    const first_slot = await slots.first().elementHandle({ timeout: 5000 });
    await first_slot?.waitForElementState("stable", { timeout: 5000 });

    // Get the total number of slots (the check above fails if there are none)
    const total_slots = await slots.count();
    await log(`Total available slots: ${total_slots}`);

    // Picks from the slots that start in 30 minutes or later, if there are any. A test can take minutes from
    // booking to cancelling, and a reservation that has started can't be cancelled.
    const date_value = await this.getTheValueFromDateInput();
    const [day = 0, month = 0, year = 0] = date_value.split(".").map(Number);
    let later_slots: number[] = [];
    for (const [index, slot_time] of (await slots.allInnerTexts()).entries()) {
      const [hours = 0, minutes = 0] = slot_time.split(":").map(Number);
      if (new Date(year, month - 1, day, hours, minutes).getTime() >= Date.now() + 30 * 60_000) {
        later_slots.push(index);
      }
    }
    if (later_slots.length === 0) {
      later_slots = Array.from({ length: total_slots }, (_, index) => index);
    }

    // Pick one of them at random
    const random_index = later_slots[Math.floor(Math.random() * later_slots.length)] ?? 0;
    await log(`Randomly selected slot index: ${random_index}`, { level: "DEBUG" });
    const selected_slot = slots.nth(random_index);

    // Get the time of the randomly selected slot
    const time_of_selected_slot = await selected_slot.innerText();
    await log(`Selected slot time: ${time_of_selected_slot}`);
    // Click the randomly selected slot
    await selected_slot.focus();
    await selected_slot.click();
    await expect(selected_slot, "The clicked slot is selected").toHaveAttribute("aria-pressed", "true");

    return time_of_selected_slot;
  }

  /**
   * Clicks the submit button in quick reservation using JavaScript.
   * Polls for button to be enabled before clicking with dispatchEvent.
   */
  @step("quick_reservation.User Clicks Submit Button In Quick Reservation")
  async userClicksSubmitButtonInQuickReservation() {
    const submit = this.page.locator("#quick-reservation").getByTestId("quick-reservation__button--submit");

    // Wait for button to be visible
    await submit.waitFor({ state: "visible", timeout: 10_000 });

    // Verify the button exists inside quick-reservation before clicking
    await expect(submit, "Quick reservation has one submit button").toHaveCount(1);
    await submit.scrollIntoViewIfNeeded();

    // Alternative: Basic Browser library click (commented out - less reliable with React re-renders)
    // Wait For Elements State  ${button_selector}  enabled  timeout=10s
    // Click  ${button_selector}

    // The button's mouse events, dispatched to the button itself once it is enabled: a click at its position was
    // less reliable while React re-renders the form
    await expect(submit, "The submit button is enabled").toBeEnabled();
    await this.page.waitForTimeout(300);
    for (const type of ["mousedown", "mouseup", "click"]) {
      // oxlint-disable-next-line no-await-in-loop -- the events in order
      await submit.dispatchEvent(type);
    }
    await log("Clicked the submit button", { level: "DEBUG" });

    // Wait for the target page element
    await expect(
      this.page.getByTestId("reservation__form--reservee-info"),
      "The booking details page shows the reservee form"
    ).toBeVisible({ timeout: 20_000 });
  }

  /** Returns a lock name for the open reservation unit page. */
  @step("quick_reservation.Get Unit Lock Name")
  // oxlint-disable-next-line eslint/require-await -- keywords are async, each call is a report step
  async getUnitLockName() {
    const url = this.page.url();
    const unit_page = url.split("?")[0];
    return `QUICK_RESERVATION_${unit_page}`;
  }

  /**
   * Reloads and waits for the unit's existing reservations (AffectingReservations query),
   * so that the free slots shown are up to date. If the browser has left the unit page (a submit that went through
   * opens the booking details page), opens the unit page again instead.
   */
  @step("quick_reservation.Reload Reservation Unit Page And Wait For Reservations")
  async reloadReservationUnitPageAndWaitForReservations(unit_page_url: string) {
    // Starts waiting once the reload has replaced the page, not before it. The page being replaced can start
    // the same query just before the reload, and that response (whose body never finishes) was taken for the new one.
    // The new page can't send its query before its scripts have loaded.
    if (new URL(this.page.url()).pathname === new URL(unit_page_url).pathname) {
      await this.page.reload({ waitUntil: "commit" });
    } else {
      await this.page.goto(unit_page_url, { waitUntil: "commit" });
    }
    const reservations_loaded: PendingResponse = await this.startWaitingForReservationsQuery();
    await this.waitForReservationsQuery(reservations_loaded);
    await this.page.waitForLoadState("load");
  }

  /** Starts waiting for the next AffectingReservations response. Call it before the action that opens the page. */
  @step("quick_reservation.Start Waiting For Reservations Query")
  startWaitingForReservationsQuery(): Promise<PendingResponse> {
    const started = Date.now();
    const response = this.page.waitForResponse(
      (candidate) =>
        candidate.request().timing().startTime >= started &&
        candidate.url().includes("/graphql") &&
        (candidate.request().postData() ?? "").includes("AffectingReservations"),
      { timeout: 20_000 }
    );
    // Awaited by Wait For Reservations Query. If the action before that fails, its error is the one to report, so
    // this one is marked as handled.
    // oxlint-disable-next-line promise/prefer-await-to-then -- only marks the promise as handled
    response.catch(() => undefined);
    return Promise.resolve({ response });
  }

  @step("quick_reservation.Wait For Reservations Query")
  async waitForReservationsQuery(reservations_loaded: PendingResponse) {
    const response = await reservations_loaded.response;
    expect(response.ok(), `The reservations query succeeds (HTTP ${response.status()})`).toBe(true);
    expect(await graphqlErrorsIn(response, 20_000), "The reservations query has no errors").toBe(false);
  }

  @step("quick_reservation.Select Duration")
  async selectDuration(duration: string) {
    // Click  id=quick-reservation >> css=.Select-module_selectAndListContainer__vSJEv
    const main_button = "#quick-reservation__duration-main-button";
    // The button shows the selected duration in an element of its own
    const selected_duration = this.page.locator(main_button).getByText(duration, { exact: true });
    // Clicking the selected duration would unselect it
    if ((await selected_duration.count()) === 0) {
      await this.page.locator("#quick-reservation").locator(main_button).click();
      await this.page.getByRole("option", { name: duration, exact: true }).click();
    }
    await selected_duration.first().waitFor({ state: "visible", timeout: 5000 });
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  @step("quick_reservation.Click More Available Slots")
  async clickMoreAvailableSlots() {
    await this.page.getByTestId("quick-reservation__next-available-time").click();
  }

  /**
   * This keyword/test cannot be run overnight. For now varaamo cannot handle overnight reservations.
   * Example -> Su 1.10.2023 klo 23:45-0:45, 1 t != La 30.9.2023 klo 23:45-su 1.10.20230:45, 1 t
   */
  @step("quick_reservation.Check The Quick Reservation Time")
  async checkTheQuickReservationTime(time_of_quick_reservation_slot: string) {
    const reservationtime = this.page.getByTestId("reservation__reservation-info-card__duration");
    await expect(reservationtime).toHaveText(time_of_quick_reservation_slot, { useInnerText: true });
  }

  /**
   * Verifies the price in quick reservation info card.
   * Note: Price may not render immediately, causing mismatches like
   * "40,00 €" vs "0 - 40,00 €". Retries until the price is fully rendered.
   */
  @step("quick_reservation.Check The Price Of Quick Reservation")
  async checkThePriceOfQuickReservation(price_with_text: string) {
    // expect retries until the price matches. It normalizes whitespace, non-breaking spaces included.
    await expect(this.page.getByTestId("reservation__reservation-info-card__price")).toHaveText(price_with_text, {
      useInnerText: true,
      timeout: CONTENT_WAIT_TIMEOUT,
    });
  }

  @step("quick_reservation.Info Card Price Should Be")
  async infoCardPriceShouldBe(price_with_text: string) {
    const reservation_price = await this.page.getByTestId("reservation__reservation-info-card__price").innerText();
    const normalized_string = await this.pages.customKeywords.removeNonBreakingSpace(reservation_price);
    expect(normalized_string).toBe(price_with_text);
  }

  /** Reads the booking number from the info card and returns it, e.g. 59923. */
  @step("quick_reservation.Get Booking Number")
  async getBookingNumber() {
    // The number is shown once the reservation has loaded
    const number_element = this.page.getByTestId("reservation__reservation-info-card__reservationNumber");
    await expect(number_element).toHaveText(/^\d+$/, { useInnerText: true });
    const booking_number = await number_element.innerText();
    await log(booking_number);
    return booking_number;
  }

  @step("quick_reservation.Check Booking Number")
  async checkBookingNumber(booking_number: string) {
    await expect(this.page.getByTestId("reservation__reservation-info-card__reservationNumber")).toHaveText(
      booking_number,
      { useInnerText: true }
    );
  }

  /** Extracts and saves the numeric access code from the element. */
  @step("quick_reservation.Get Access Code")
  async getAccessCode() {
    // The access code is filled in after the card renders
    await expect(this.page.getByTestId("reservation__reservation-info-card__accessType")).toContainText(/\d/);
    const access_code_numbers = await this.pages.customKeywords.getNumberFromElementText(
      this.page.getByTestId("reservation__reservation-info-card__accessType")
    );
    // Add # at the end as it's required for access code entry in the system
    const access_code_with_hash = `${access_code_numbers}#`;
    this.state.accessCode = access_code_with_hash;
    await log(`Saved access code (with #): ${this.state.accessCode}`);
  }

  @step("quick_reservation.Check Access Code")
  async checkAccessCode(access_code: string) {
    await this.pages.customKeywords.checkNumberFromTextIsEqualTo(
      this.page.getByTestId("reservation__reservation-info-card__accessType"),
      access_code
    );
  }

  @step("quick_reservation.Confirms Date Picker Opens From Quick Reservation")
  async confirmsDatePickerOpensFromQuickReservation() {
    // The click waits for the date input's button, which renders with the input
    const quick_reservation = this.page.locator("#quick-reservation");
    await quick_reservation.getByRole("button", { name: "Valitse päivämäärä", exact: true }).click();

    // Ensures cancel button is visible: the date picker's own, in the HDS dialog (hidden from roles while closed)
    const date_picker = quick_reservation.getByRole("dialog");
    await expect(date_picker.getByTestId("closeButton")).toBeVisible();

    // Confirms the select button exists and closes the datepicker dialog window
    await date_picker.getByTestId("selectButton").click();

    // Verify the datepicker dialog is closed
    await expect(date_picker).toBeHidden({ timeout: 5000 });
  }

  /** Gets the current date value from the quick reservation date input field */
  @step("quick_reservation.Get The Value From Date Input")
  async getTheValueFromDateInput() {
    const value = await this.page.locator("#quick-reservation__date").inputValue();
    await log(`The value of the quick reservation date is: ${value}`);
    return value;
  }

  // MOBILE
  @step("quick_reservation.Select Duration Mobile")
  async selectDurationMobile(duration: string) {
    // Set to 1h
    await this.page.locator("#mobile-quick-reservation-duration-toggle-button").click();
    // The clicks wait until the list's animation has ended
    await this.page.getByRole("option", { name: duration, exact: true }).click();
  }

  /** Verifies that the specified time slot is not available in the list of free slots. */
  @step("quick_reservation.Verify Time Slot Not Available")
  async verifyTimeSlotNotAvailable(time_to_check: string) {
    await this.page.locator("#quick-reservation__duration-main-button").waitFor({ state: "visible" });
    const slots = this.page.locator('[class*="slider-list"]').getByTestId("quick-reservation__slot");
    // The free slots are rendered after the reservation form
    await expect(slots.first()).toBeVisible();
    // The page shows the free slots before its AffectingReservations query returns and removes the booked ones, so
    // this waits until the slot is gone (the query can take over 10 s on the test env). A slot button's only text
    // is its time.
    await expect(
      slots.and(this.page.getByText(time_to_check, { exact: true })),
      `The free slots don't include ${time_to_check}`
    ).toHaveCount(0, { timeout: 20_000 });

    // Fail the test if no slots are shown at all: then the check above had nothing to compare with
    await expect(slots.first(), "Quick reservation shows some free slots").toBeAttached();

    // The texts of the slots shown now, skipping blanks
    const slot_texts: string[] = (await slots.allInnerTexts()).filter((text) => text !== "");
    await log(`Collected slots: ${slot_texts.join(", ")}`);
  }
}
