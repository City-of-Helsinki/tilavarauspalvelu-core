import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { RECURRING_BOOKING_CALENDAR_FI } from "../../Resources/texts_FI";

// The application calendar's cells are 15 minutes long
const CALENDAR_STEP_MINUTES = 15;

/** The start of the calendar cell that ends at `time`, e.g. "20:45" for "21:00" */
function cellStartBefore(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const start = hours * 60 + minutes - CALENDAR_STEP_MINUTES;
  return `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
}

/** Page 2 of the seasonal application: the type of the time requests, and the times painted in the calendar. */
export class RecurringApplicationsPage2 extends PageObject {
  @step("recurring_applications_page2.User Selects Type Of The Booking Request")
  async userSelectsTypeOfTheBookingRequest(type_of_booking_request_txt: string) {
    // A radio button: the times painted after it get this type
    await this.page.getByRole("radio", { name: type_of_booking_request_txt, exact: true }).check();
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
    const calendar = this.page.getByRole("grid", { name: RECURRING_BOOKING_CALENDAR_FI });
    // A cell is named by its weekday, its time and its state, e.g. "Torstai, 19:00–19:15, Varattavissa tässä tilassa"
    const first_cell = calendar.getByRole("gridcell", { name: new RegExp(`^${weekday}, ${from}–`) });
    const last_cell = calendar.getByRole("gridcell", {
      name: new RegExp(`^${weekday}, ${cellStartBefore(to)}–${to},`),
    });
    // Dragging from a cell to another on the same day paints the cells between them, like a user does with a mouse
    await first_cell.dragTo(last_cell);
    // The first cell of a painted run is named after the whole run
    await expect(first_cell, `The calendar has ${weekday} ${from}–${to} painted`).toHaveAccessibleName(
      new RegExp(`^${weekday}, ${from}–${to}, `)
    );
  }

  @step("recurring_applications_page2.User Clicks Continue Button")
  async userClicksContinueButton() {
    // This is the same in page 3
    await this.pages.customKeywords.clickAndWaitForPage("#button__application--next");
  }
}
