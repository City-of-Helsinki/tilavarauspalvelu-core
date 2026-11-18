import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { CALENDAR_STEP_MINUTES, minutesOf, selectedTimesAsShown } from "../../recurring-times";
import {
  RECURRING_BOOKING_CALENDAR_FI,
  RECURRING_BOOKING_FORM_ADD,
  RECURRING_BOOKING_FORM_DAY,
  RECURRING_BOOKING_FORM_FROM,
  RECURRING_BOOKING_FORM_TO,
  RECURRING_BOOKING_FREE_CELL,
  RECURRING_BOOKING_NO_SELECTED_TIMES,
  RECURRING_BOOKING_REMOVE_TIME,
  RECURRING_BOOKING_SELECTED_TIMES,
  RECURRING_BOOKING_SUMMARY_PRIMARY,
  RECURRING_BOOKING_SUMMARY_SECONDARY,
  RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_GROUP,
  RECURRING_BOOKING_UNAVAILABLE_CELL,
} from "../../Resources/texts_FI";

/** A clock time from minutes from midnight, e.g. "19:00" for 1140 */
function clockOf(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** The start of the calendar cell that ends at `time`, e.g. "20:45" for "21:00" */
function cellStartBefore(time: string): string {
  return clockOf(minutesOf(time) - CALENDAR_STEP_MINUTES);
}

/** The end of the calendar cell that starts at `time`, e.g. "19:15" for "19:00" */
function cellEndAfter(time: string): string {
  return clockOf(minutesOf(time) + CALENDAR_STEP_MINUTES);
}

/**
 * Page 2 of the seasonal application: the type of the time requests, the times painted in the calendar, the form
 * that adds times, its list of the selected times, and the summary of the times under it.
 */
export class RecurringApplicationsPage2 extends PageObject {
  /** The application's calendar, where the times are painted */
  private get calendar() {
    return this.page.getByRole("grid", { name: RECURRING_BOOKING_CALENDAR_FI });
  }

  /**
   * The calendar cell that starts at `time`. A cell is named by its weekday, its time and its state, e.g.
   * "Torstai, 19:00–19:15, Varattavissa tässä tilassa". The first cell of a time names the whole time instead.
   */
  private cellAt(weekday: string, time: string) {
    return this.calendar.getByRole("gridcell", { name: new RegExp(`^${weekday}, ${time}–`) });
  }

  /** The form under the calendar. It also holds the list of the selected times. */
  private get form() {
    return this.page.getByTestId("time-selector__form-0");
  }

  /** The notice under the summary that tells why page 2 can't be continued */
  private get notice() {
    return this.page.getByTestId("application__page2--notification-min-duration");
  }

  /** The Continue button. Page 3's has the same id. */
  private get continueButton() {
    return this.page.locator("#button__application--next");
  }

  /** Drags from the cell that starts at `from` to the cell that ends at `to`, on one weekday */
  private async drag(weekday: string, from: string, to: string) {
    // Like a user does with a mouse. The drag covers the cells between the two, on the same day.
    await this.cellAt(weekday, from).dragTo(this.cellAt(weekday, cellStartBefore(to)));
  }

  /** Checks the first and the last cell from `from` to `to`: no time on them, and the state */
  private async expectCellsToBe(weekday: string, from: string, to: string, state: string) {
    const last = cellStartBefore(to);
    await expect(this.cellAt(weekday, from), `${weekday} ${from} is ${state}`).toHaveAccessibleName(
      `${weekday}, ${from}–${cellEndAfter(from)}, ${state}`
    );
    await expect(this.cellAt(weekday, last), `${weekday} ${last} is ${state}`).toHaveAccessibleName(
      `${weekday}, ${last}–${to}, ${state}`
    );
  }

  @step("recurring_applications_page2.User Selects Type Of The Booking Request")
  async userSelectsTypeOfTheBookingRequest(type_of_booking_request_txt: string) {
    // A radio button: the times painted after it get this type. The circle of its label is drawn over the input, so a
    // click on the input would hit the label. The label is clicked, like a user does. Its text is also the heading of
    // the times painted with that type, so the click stays in the radio group.
    const types = this.page.getByRole("group", { name: RECURRING_BOOKING_TYPE_OF_BOOKING_REQUEST_GROUP, exact: true });
    await types.getByText(type_of_booking_request_txt, { exact: true }).click();
    await expect(
      types.getByRole("radio", { name: type_of_booking_request_txt, exact: true }),
      "The type of the times is selected"
    ).toBeChecked();
  }

  @step("recurring_applications_page2.User Clicks Available Seasonal Booking Times For")
  async userClicksAvailableSeasonalBookingTimesFor(name_of_the_unit: string) {
    const main_button = this.page.getByRole("combobox", { name: "Näytä kausivarattavat" });
    await main_button.click();
    await this.page.getByRole("option", { name: name_of_the_unit, exact: true }).click();
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  /** Paints the times of one weekday, from `from` to `to`, in the calendar with the type selected before. */
  @step("recurring_applications_page2.User Selects The Times For Recurring Application")
  async userSelectsTheTimesForRecurringApplication(weekday: string, from: string, to: string) {
    await this.drag(weekday, from, to);
    // The first cell of a painted run is named after the whole run
    await expect(this.cellAt(weekday, from), `The calendar has ${weekday} ${from}–${to} painted`).toHaveAccessibleName(
      new RegExp(`^${weekday}, ${from}–${to}, `)
    );
  }

  /**
   * Drags over the times of one weekday, and leaves the checks to the caller. The cell the drag starts on decides what
   * the whole drag does: from a free cell it paints the type selected before, from a time of that type it erases, and
   * from a time of the other type it paints the selected type over. A drag that starts on a closed cell does nothing,
   * and closed cells are never painted.
   */
  @step("recurring_applications_page2.User Drags Over The Times")
  async userDragsOverTheTimes(weekday: string, from: string, to: string) {
    await this.drag(weekday, from, to);
  }

  /** Paints with the keyboard: focuses the first cell, then presses Shift+↓ once for each cell after it */
  @step("recurring_applications_page2.User Selects The Times With The Keyboard")
  async userSelectsTheTimesWithTheKeyboard(weekday: string, from: string, to: string) {
    await this.cellAt(weekday, from).focus();
    // Shift stays down: letting it go ends the sweep, and the next Shift+↓ would start a new one on a painted cell,
    // which erases
    await this.page.keyboard.down("Shift");
    try {
      for (let cell = minutesOf(from) + CALENDAR_STEP_MINUTES; cell < minutesOf(to); cell += CALENDAR_STEP_MINUTES) {
        await this.page.keyboard.press("ArrowDown");
      }
    } finally {
      await this.page.keyboard.up("Shift");
    }
  }

  /** Space on a cell paints it if it's free, or erases it if it has a time of the selected type */
  @step("recurring_applications_page2.User Toggles The Time With The Keyboard")
  async userTogglesTheTimeWithTheKeyboard(weekday: string, time: string) {
    await this.cellAt(weekday, time).focus();
    await this.page.keyboard.press("Space");
  }

  /** Adds a time with the form under the calendar, with the type selected before, and leaves the checks to the caller */
  @step("recurring_applications_page2.User Adds The Times With The Form")
  async userAddsTheTimesWithTheForm(weekday: string, from: string, to: string) {
    // Native selects, found by role: a label lookup would also read their options
    const select = (name: string) => this.form.getByRole("combobox", { name, exact: true });
    await select(RECURRING_BOOKING_FORM_DAY).selectOption({ label: weekday });
    await select(RECURRING_BOOKING_FORM_FROM).selectOption({ label: from });
    await select(RECURRING_BOOKING_FORM_TO).selectOption({ label: to });
    await this.form.getByRole("button", { name: RECURRING_BOOKING_FORM_ADD, exact: true }).click();
  }

  /** Removes a whole time with its × button in the list of the selected times */
  @step("recurring_applications_page2.User Removes The Selected Time")
  async userRemovesTheSelectedTime(weekday: string, from: string, to: string) {
    await this.form
      .getByRole("button", { name: `${RECURRING_BOOKING_REMOVE_TIME} ${weekday} ${from}–${to}`, exact: true })
      .click();
  }

  /**
   * Checks that the calendar has one time from `from` to `to` of the type, with exactly this message on it, or with no
   * message when none is given
   */
  @step("recurring_applications_page2.User Checks The Painted Times")
  async userChecksThePaintedTimes(weekday: string, from: string, to: string, type: string, message = "") {
    // The first cell of a time names the whole time. A message, like a too short time's, follows the type.
    const name = `${weekday}, ${from}–${to}, ${type}${message ? `, ${message}` : ""}`;
    await expect(this.cellAt(weekday, from), `The calendar has ${weekday} ${from}–${to}, ${type}`).toHaveAccessibleName(
      name
    );
  }

  /** Checks that the first and the last cell from `from` to `to` are free */
  @step("recurring_applications_page2.User Checks The Times Are Free")
  async userChecksTheTimesAreFree(weekday: string, from: string, to: string) {
    await this.expectCellsToBe(weekday, from, to, RECURRING_BOOKING_FREE_CELL);
  }

  /** Checks that the first and the last cell from `from` to `to` are still closed in every unit of the application */
  @step("recurring_applications_page2.User Checks The Times Are Closed")
  async userChecksTheTimesAreClosed(weekday: string, from: string, to: string) {
    await this.expectCellsToBe(weekday, from, to, RECURRING_BOOKING_UNAVAILABLE_CELL);
  }

  /**
   * Checks that the list of the selected times, the summary under it and the calendar all show exactly these times,
   * written as in `recurring-times.ts`, e.g. "To 19:00–21:00 E". With no times, the list says so, the summary is empty
   * and the calendar has no painted cells.
   */
  @step("recurring_applications_page2.User Checks The Selected Times")
  async userChecksTheSelectedTimes(...times: string[]) {
    const shown = selectedTimesAsShown(times);
    // An item's text is in its span. The item also holds the × button.
    const items = this.form
      .getByRole("list", { name: RECURRING_BOOKING_SELECTED_TIMES, exact: true })
      .locator("li > span");
    await expect(items, "The list has the selected times").toHaveText(shown.list);
    if (times.length === 0) {
      await expect(
        this.form.getByText(RECURRING_BOOKING_NO_SELECTED_TIMES, { exact: true }),
        "The list says no times are selected"
      ).toBeVisible();
    }
    const summary = this.page.getByTestId("time-selector__preview-0");
    for (const [heading, rows] of [
      [RECURRING_BOOKING_SUMMARY_PRIMARY, shown.primary],
      [RECURRING_BOOKING_SUMMARY_SECONDARY, shown.secondary],
    ] as const) {
      // A column is its heading and a row per weekday
      const column = summary.getByRole("heading", { name: heading, exact: true }).locator("..");
      await expect(column.locator(":scope > div"), `The summary's ${heading} are the selected ones`).toHaveText(rows);
    }
    // A cell with a time on it is selected, so the count covers every cell, not only the first and the last
    await expect(
      this.calendar.getByRole("gridcell", { selected: true }),
      "The calendar has the cells of the selected times painted, and no other cells"
    ).toHaveCount(shown.cells);
  }

  /** Checks the form's error, which tells why it didn't add a time */
  @step("recurring_applications_page2.User Checks The Form Error")
  async userChecksTheFormError(error: string) {
    await expect(this.form.getByRole("alert"), "The form tells why it didn't add the time").toHaveText(error);
  }

  @step("recurring_applications_page2.User Checks The Form Has No Error")
  async userChecksTheFormHasNoError() {
    await expect(this.form.getByRole("alert"), "The form has no error").toBeHidden();
  }

  /** Checks that page 2 can't be continued: Continue is disabled, and the notice under the summary tells why */
  @step("recurring_applications_page2.User Checks Continue Is Disabled")
  async userChecksContinueIsDisabled(error: string) {
    await expect(this.continueButton, "Continue is disabled").toBeDisabled();
    await expect(this.notice, "The notice tells why").toContainText(error);
  }

  /** Checks that page 2 can be continued: Continue is enabled, and there's no notice */
  @step("recurring_applications_page2.User Checks Continue Is Enabled")
  async userChecksContinueIsEnabled() {
    await expect(this.continueButton, "Continue is enabled").toBeEnabled();
    await expect(this.notice, "There is no notice").toBeHidden();
  }

  @step("recurring_applications_page2.User Clicks Continue Button")
  async userClicksContinueButton() {
    // This is the same in page 3
    await this.pages.customKeywords.clickAndWaitForPage(this.continueButton);
  }
}
