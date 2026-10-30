/** A resource file with top navigation keywords. */
import { step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class RecurringApplicationsPage2 extends PageObject {
  @step("recurring_applications_page2.User Selects Type Of The Booking Request")
  async userSelectsTypeOfTheBookingRequest(type_of_booking_request_txt: string) {
    const main_button = this.page.getByRole("combobox", { name: "Aikatoiveen tyyppi." });
    await main_button.click();
    await this.page.getByRole("option", { name: type_of_booking_request_txt, exact: true }).click();
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  @step("recurring_applications_page2.User Clicks Available Seasonal Booking Times For")
  async userClicksAvailableSeasonalBookingTimesFor(name_of_the_unit: string) {
    const main_button = this.page.getByRole("combobox", { name: "Näytä kausivarattavat" });
    await main_button.click();
    await this.page.getByRole("option", { name: name_of_the_unit, exact: true }).click();
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  @step("recurring_applications_page2.User Selects The Times For Recurring Application")
  async userSelectsTheTimesForRecurringApplication(selector_for_time_of_the_booking: string) {
    await this.page.locator(selector_for_time_of_the_booking).click();
  }

  @step("recurring_applications_page2.User Clicks Continue Button")
  async userClicksContinueButton() {
    // This is the same in page 3
    await this.pages.customKeywords.clickAndWaitForPage("#button__application--next");
  }
}
