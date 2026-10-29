/** A resource file with top navigation keywords. */
import { step } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class RecurringApplications extends PageObject {
  @step("recurring_applications.User Fills The Recurring Reservation Name")
  async userFillsTheRecurringReservationName(name_of_the_recurring_reservation: string) {
    await this.page.locator('[id="applicationSections.0.name"]').fill(name_of_the_recurring_reservation);
  }

  @step("recurring_applications.User Fills The Number Of People In The Recurring Reservation")
  async userFillsTheNumberOfPeopleInTheRecurringReservation(number_of_people: string) {
    await this.page.locator('[id="applicationSections.0.numPersons"]').fill(number_of_people);
  }

  @step("recurring_applications.User Fills The Age Group In The Recurring Reservation")
  async userFillsTheAgeGroupInTheRecurringReservation(age_group: string) {
    await this.page.locator('[aria-label*="Ikäryhmä. "]').click();
    await this.pages.customKeywords.findAndClickElementWithText("span", age_group);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen('[aria-haspopup="listbox"][aria-label*="Ikäryhmä. "]');
  }

  @step("recurring_applications.User Chooses The Purpose Of The Recurring Reservation")
  async userChoosesThePurposeOfTheRecurringReservation(purpose: string) {
    await this.page.locator('[aria-label*="Varauksen käyttötarkoitus. "]').click();
    await this.pages.customKeywords.findAndClickElementWithText("span", purpose);
    await this.pages.customKeywords.closeSelectListIfOpen(
      '[aria-haspopup="listbox"][aria-label*="Varauksen käyttötarkoitus. "]'
    );
  }

  @step("recurring_applications.User Selects The Default Time Period For The Recurring Reservation")
  async userSelectsTheDefaultTimePeriodForTheRecurringReservation() {
    await this.page.locator('[id="applicationSections.0.defaultPeriod"]').click();
  }

  @step("recurring_applications.User Selects The Minimum Length For The Recurring Reservation")
  async userSelectsTheMinimumLengthForTheRecurringReservation(minimum_length: string) {
    await this.page.locator('[aria-label*="Varauksen vähimmäiskesto. "]').click();
    await this.pages.customKeywords.findAndClickElementWithText("span", minimum_length);
    await this.pages.customKeywords.closeSelectListIfOpen(
      '[aria-haspopup="listbox"][aria-label*="Varauksen vähimmäiskesto. "]'
    );
  }

  @step("recurring_applications.User Selects The Maximum Length For The Recurring Reservation")
  async userSelectsTheMaximumLengthForTheRecurringReservation(maximum_length: string) {
    await this.page.locator('[aria-label*="Varauksen enimmäiskesto. "]').click();
    await this.pages.customKeywords.findAndClickElementWithText("span", maximum_length);
    await this.pages.customKeywords.closeSelectListIfOpen(
      '[aria-haspopup="listbox"][aria-label*="Varauksen enimmäiskesto. "]'
    );
  }

  @step("recurring_applications.User Selects The Amount Of Reservations Per Week")
  async userSelectsTheAmountOfReservationsPerWeek(amount_of_reservations_per_week: string) {
    await this.page
      .locator('[id="applicationSections.0.appliedReservationsPerWeek"]')
      .fill(amount_of_reservations_per_week);
  }

  @step("recurring_applications.User Clicks Continue Button")
  async userClicksContinueButton() {
    await this.page.locator("#button__application--next").click();
  }
}
