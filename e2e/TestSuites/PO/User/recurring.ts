/** A resource file with top navigation keywords. */
import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class Recurring extends PageObject {
  @step("recurring.User Selects A Recurring Booking Round")
  async userSelectsARecurringBookingRound(name_of_the_recurring_reservation: string) {
    const url_before = this.page.url();
    // The first active round's card with this name, and its link to the round (the card's other link is to the
    // round's criteria)
    await this.page
      .getByTestId("recurring-lander__application-round-container--active")
      .locator(".card--default")
      .filter({ has: this.page.getByRole("heading", { name: name_of_the_recurring_reservation, exact: true }) })
      .first()
      .locator('a[href*="/recurring/"]:not([href*="/criteria"])')
      .click();
    // The round's page opens, its units are waited for when they are selected
    // Port: expect retries until the URL has changed, instead of Wait Until Keyword Succeeds with Url Should Have
    // Changed
    await expect(this.page).toHaveURL((url) => url.href !== url_before, { timeout: 20_000 });
  }

  @step("recurring.User Selects The Units For Recurring Reservation")
  async userSelectsTheUnitsForRecurringReservation(name_of_the_recurring_unit: string) {
    // The units are loaded after the page opens, so the click waits up to 20 s for the unit's card
    await this.page
      .locator(".card--default")
      .filter({ has: this.page.getByRole("heading", { name: name_of_the_recurring_unit, exact: true }) })
      .first()
      .getByTestId("recurring-card__button--toggle")
      .click({ timeout: 20_000 });
  }

  @step("recurring.User Checks The Count Of Selected Units")
  async userChecksTheCountOfSelectedUnits(expected_text: string) {
    await this.pages.customKeywords.checkElementsText("#reservationUnitCount", expected_text);
  }

  @step("recurring.User Clicks Continue Button")
  async userClicksContinueButton() {
    // Starting the application opens its first page
    await this.pages.customKeywords.clickAndWaitForPage("#startApplicationButton", "/page1");
  }
}
