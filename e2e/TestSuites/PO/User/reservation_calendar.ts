/** Port of PO/User/reservation_calendar.robot */
import { reachesState } from "../../../lib/locators";
import { step, expect, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class ReservationCalendar extends PageObject {
  @step("reservation_calendar.Select Duration Calendar")
  async selectDurationCalendar(duration: string) {
    // Click  [data-testid="reservation__input--duration"] >> id=duration-toggle-button
    await this.page
      .getByTestId("calendar-controls__duration")
      .locator("#calendar-controls__duration-main-button")
      .click();
    await this.page.getByRole("option", { name: duration, exact: true }).click();
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen("#calendar-controls__duration-main-button");
  }

  @step("reservation_calendar.Click And Store Free Reservation Time")
  async clickAndStoreFreeReservationTime() {
    await this.page.locator("#calendar-controls__time-main-button").click();
    // The list is open when its options are shown
    await expect(
      this.page.locator("#calendar-controls__time-option-0"),
      "The time selection list did not open"
    ).toBeVisible({ timeout: 5000 });

    // Check if enough time slots are available for the current day
    const time_slot_exists = await reachesState(this.page.locator("#calendar-controls__time-option-2"), "attached");
    if (!time_slot_exists) {
      const available_slots = await this.page.locator('[id^="calendar-controls__time-option-"]').count();
      throw new Error(
        `Not enough available time slots for the current day. Expected at least 3 slots, but found ${available_slots}. Try selecting a different date or time range.`
      );
    }

    const calendar_control_time_of_third_free_slot = await this.page
      .locator("#calendar-controls__time-option-2")
      .innerText();
    this.state.calendarControlTimeOfFreeSlot = calendar_control_time_of_third_free_slot;
    // Clicking the current time would unselect it and keep the continue button disabled
    const selected_time = this.page
      .locator("#calendar-controls__time-main-button")
      .getByText(this.state.calendarControlTimeOfFreeSlot, { exact: true });
    const is_current_time = await selected_time.count();
    if (is_current_time > 0) {
      await log(`${this.state.calendarControlTimeOfFreeSlot} is the current time, changing to a different time`);
      await this.changingTimeAgain();
    } else {
      await log(`Attempting to select time: ${this.state.calendarControlTimeOfFreeSlot}`);
      await this.page.locator("#calendar-controls__time-option-2").click();
    }
    await this.page
      .locator("#calendar-controls__time-main-button")
      .getByText(this.state.calendarControlTimeOfFreeSlot, { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
    await this.pages.customKeywords.closeSelectListIfOpen("#calendar-controls__time-main-button");
  }

  @step("reservation_calendar.Changing Time Again")
  async changingTimeAgain() {
    // Check if the 4th time slot is available
    const time_slot_exists = await reachesState(this.page.locator("#calendar-controls__time-option-3"), "attached");
    if (!time_slot_exists) {
      const available_slots = await this.page.locator('[id^="calendar-controls__time-option-"]').count();
      throw new Error(
        `Not enough available time slots to change time. Expected at least 4 slots, but found ${available_slots}. Try selecting a different date or time range.`
      );
    }

    const calendar_control_time_of_fourth_free_slot = await this.page
      .locator("#calendar-controls__time-option-3")
      .innerText();
    this.state.calendarControlTimeOfFreeSlot = calendar_control_time_of_fourth_free_slot;
    await log(`Selecting alternative time: ${this.state.calendarControlTimeOfFreeSlot}`);
    await this.page.locator("#calendar-controls__time-option-3").click();
  }

  @step("reservation_calendar.Get Current Date From Datepicker")
  async getCurrentDateFromDatepicker() {
    // ${value}=  Browser.Get Attribute  id=reservationDialog.date  value
    const value = await this.page.locator("#controlled-date-input__date").inputValue();
    await log(`The value of the quick reservation date is: ${value}`);
    return value;
  }

  @step("reservation_calendar.Click Continue Button")
  async clickContinueButton() {
    await this.page.getByTestId("reservation__button--continue").click();
    // Continuing opens the terms step of the edit
    await this.page
      .locator('[for="cancellation-and-payment-terms-terms-accepted"]')
      .waitFor({ state: "visible", timeout: 15_000 });
  }

  @step("reservation_calendar.User Click Reservation Calendar Toggle Button")
  async userClickReservationCalendarToggleButton() {
    // The next click waits until the calendar's animation has ended
    await this.page.getByTestId("calendar-controls__toggle-button").click();
  }
}
