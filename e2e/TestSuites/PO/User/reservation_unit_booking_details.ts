/** Port of PO/User/reservation_unit_booking_details.robot */
import { step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class ReservationUnitBookingDetails extends PageObject {
  // BOOKING DETAILS
  @step("reservation_unit_booking_details.Type The Name Of The Booking")
  async typeTheNameOfTheBooking(name_of_the_booking: string) {
    await this.page.locator("#reservation-form-field__name").fill(name_of_the_booking);
  }

  @step("reservation_unit_booking_details.Select The Purpose Of The Booking")
  async selectThePurposeOfTheBooking(purpose: string) {
    await this.page.locator("#reservation-form-field__purpose-main-button").click();
    await this.pages.customKeywords.findAndClickElementWithText("li", purpose);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen("#reservation-form-field__purpose-main-button");
  }

  @step("reservation_unit_booking_details.Select The Number Of Participants")
  async selectTheNumberOfParticipants(number_of_persons: string) {
    await this.page.locator("#reservation-form-field__numPersons").fill(number_of_persons);
  }

  @step("reservation_unit_booking_details.Type The Description Of The Booking")
  async typeTheDescriptionOfTheBooking(description_txt: string) {
    await this.page.locator("#reservation-form-field__description").fill(description_txt);
  }

  @step("reservation_unit_booking_details.Click To Apply For A Free Booking")
  async clickToApplyForAFreeBooking() {
    await this.page.locator("#reservation-form-field__applyingForFreeOfCharge").check();
  }

  @step("reservation_unit_booking_details.Type Justification For Free Of Charge")
  async typeJustificationForFreeOfCharge(reason: string) {
    await this.page.locator("#reservation-form-field__freeOfChargeReason").fill(reason);
  }

  @step("reservation_unit_booking_details.Click And Select AgeGroup Button")
  async clickAndSelectAgeGroupButton(age_group: string) {
    await this.page.locator("#reservation-form-field__ageGroup-main-button").click();
    await this.pages.customKeywords.findAndClickElementWithText("li", age_group);
    await this.pages.customKeywords.closeSelectListIfOpen("#reservation-form-field__ageGroup-main-button");
  }
}
