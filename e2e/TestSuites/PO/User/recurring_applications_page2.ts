/** A resource file with top navigation keywords. */
import { step, log } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class RecurringApplicationsPage2 extends PageObject {
  @step("recurring_applications_page2.User Selects Type Of The Booking Request")
  async userSelectsTypeOfTheBookingRequest(type_of_booking_request_txt: string) {
    await this.page.locator('[aria-label*="Aikatoiveen tyyppi. "]').click();
    await this.pages.customKeywords.findAndClickElementWithText("ul >> span", type_of_booking_request_txt);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen(
      '[aria-haspopup="listbox"][aria-label*="Aikatoiveen tyyppi. "]'
    );
  }

  @step("recurring_applications_page2.User Clicks Available Seasonal Booking Times For")
  async userClicksAvailableSeasonalBookingTimesFor(name_of_the_unit: string) {
    await this.page.locator('[aria-label*="Näytä kausivarattavat "]').click();
    await this.pages.customKeywords.findAndClickElementWithText("ul >> span", name_of_the_unit);
    await this.pages.customKeywords.closeSelectListIfOpen(
      '[aria-haspopup="listbox"][aria-label*="Näytä kausivarattavat "]'
    );
  }

  @step("recurring_applications_page2.User Selects The Times For Recurring Application")
  async userSelectsTheTimesForRecurringApplication(selector_for_time_of_the_booking: string) {
    await this.page.locator(selector_for_time_of_the_booking).click();
  }

  @step("recurring_applications_page2.User Clicks Continue Button")
  async userClicksContinueButton() {
    await log("this is the same in the page 3");
    await this.pages.customKeywords.clickAndWaitForPage("#button__application--next");
  }
}
