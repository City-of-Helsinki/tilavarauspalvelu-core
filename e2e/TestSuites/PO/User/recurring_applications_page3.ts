/** A resource file with top navigation keywords. */
import { step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class RecurringApplicationsPage3 extends PageObject {
  @step("recurring_applications_page3.User Selects Who Is The Application Created For")
  async userSelectsWhoIsTheApplicationCreatedFor(application_type_element: string) {
    await this.page.locator(`label[for="${application_type_element}"]`).click();
  }

  @step("recurring_applications_page3.User Types First Name")
  async userTypesFirstName(first_name: string) {
    await this.page.locator("#contactPersonFirstName").fill(first_name);
  }

  @step("recurring_applications_page3.User Types Last Name")
  async userTypesLastName(last_name: string) {
    await this.page.locator("#contactPersonLastName").fill(last_name);
  }

  @step("recurring_applications_page3.User Types Street Address")
  async userTypesStreetAddress(street_address: string) {
    await this.page.locator("#billingStreetAddress").fill(street_address);
  }

  @step("recurring_applications_page3.User Types Post Code")
  async userTypesPostCode(post_code: string) {
    await this.page.locator("#billingPostCode").fill(post_code);
  }

  @step("recurring_applications_page3.User Types City")
  async userTypesCity(city: string) {
    await this.page.locator("#billingCity").fill(city);
  }

  @step("recurring_applications_page3.User Types Phone Number")
  async userTypesPhoneNumber(phone_number: string) {
    await this.page.locator("#contactPersonPhoneNumber").fill(phone_number);
  }

  @step("recurring_applications_page3.User Types Email")
  async userTypesEmail(email: string) {
    await this.page.locator("#contactPersonEmail").fill(email);
  }

  @step("recurring_applications_page3.User Types Additional Information")
  async userTypesAdditionalInformation(the_purpose_of_the_booking: string) {
    await this.page.locator("#additionalInformation").fill(the_purpose_of_the_booking);
  }
}
