/** A resource file with top navigation keywords. */
import { step } from "../../../lib/runtime";
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
    const main_button = this.page.getByRole("combobox", { name: "Ikäryhmä." });
    await main_button.click();
    await this.page.getByRole("option", { name: age_group, exact: true }).click();
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  @step("recurring_applications.User Chooses The Purpose Of The Recurring Reservation")
  async userChoosesThePurposeOfTheRecurringReservation(purpose: string) {
    const main_button = this.page.getByRole("combobox", { name: "Varauksen käyttötarkoitus." });
    await main_button.click();
    await this.page.getByRole("option", { name: purpose, exact: true }).click();
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  @step("recurring_applications.User Selects The Default Time Period For The Recurring Reservation")
  async userSelectsTheDefaultTimePeriodForTheRecurringReservation() {
    await this.page.locator('[id="applicationSections.0.defaultPeriod"]').click();
  }

  @step("recurring_applications.User Selects The Minimum Length For The Recurring Reservation")
  async userSelectsTheMinimumLengthForTheRecurringReservation(minimum_length: string) {
    const main_button = this.page.getByRole("combobox", { name: "Varauksen vähimmäiskesto." });
    await main_button.click();
    await this.page.getByRole("option", { name: minimum_length, exact: true }).click();
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  @step("recurring_applications.User Selects The Maximum Length For The Recurring Reservation")
  async userSelectsTheMaximumLengthForTheRecurringReservation(maximum_length: string) {
    const main_button = this.page.getByRole("combobox", { name: "Varauksen enimmäiskesto." });
    await main_button.click();
    await this.page.getByRole("option", { name: maximum_length, exact: true }).click();
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
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
