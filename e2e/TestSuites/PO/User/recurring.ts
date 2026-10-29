/** A resource file with top navigation keywords. */
import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class Recurring extends PageObject {
  @step("recurring.User Selects A Recurring Booking Round")
  async userSelectsARecurringBookingRound(name_of_the_recurring_reservation: string) {
    const url_before = this.page.url();
    await this.pages.customKeywords.findAndClickElementInCardElementByText(
      '[data-testid="recurring-lander__application-round-container--active"] >> .card--default',
      '[data-testid="card__heading"]',
      name_of_the_recurring_reservation,
      'a[href*="/recurring/"]:not([href*="/criteria"])'
    );
    // The round's page opens, its units are waited for when they are selected
    // Port: expect retries until the URL has changed, instead of Wait Until Keyword Succeeds with Url Should Have
    // Changed
    await expect(this.page).toHaveURL((url) => url.href !== url_before, { timeout: 20_000 });
  }

  @step("recurring.User Selects The Units For Recurring Reservation")
  async userSelectsTheUnitsForRecurringReservation(name_of_the_recurring_unit: string) {
    // The units are loaded after the page opens
    await this.page
      .locator('[class*="Card__CardContent"]')
      .getByTestId("card__heading")
      .locator(`text="${name_of_the_recurring_unit}"`)
      .first()
      .waitFor({ state: "visible", timeout: 20_000 });
    await this.pages.customKeywords.findAndClickElementInCardElementByText(
      '[class*="Card__CardContent"]',
      '[data-testid="card__heading"]',
      name_of_the_recurring_unit,
      '[data-testid="recurring-card__button--toggle"]'
    );
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
