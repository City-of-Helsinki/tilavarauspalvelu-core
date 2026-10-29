/** Port of PO/Admin/admin_my_units.robot */
import { expect, log, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class AdminMyUnits extends PageObject {
  @step("admin_my_units.Admin Searches Own Unit And Clicks It")
  async adminSearchesOwnUnitAndClicksIt(units_location: string) {
    await this.page.locator("#search").fill(units_location);
    // Find And Click Element With Text waits for the search results
    await this.pages.customKeywords.findAndClickElementWithText("td >> a", units_location);
    // The unit's page opens; its content is waited for by the keywords that use it
    await this.page.waitForURL((url) => /\/my-units\/\d+/.test(url.pathname));
  }

  @step("admin_my_units.Admin Clicks Calendar Open In Own Units")
  async adminClicksCalendarOpenInOwnUnits(unit_name: string) {
    // This locates the row in the calendar with the title="${unit_name}".
    // It then selects the 26th div within that row's container and clicks it.

    await log("If a wrong unit is opened, check that the DOM order has not changed");

    // The row container is the next sibling of the element with the unit's title
    // The first match, like querySelector
    const row_container = this.page.locator(`div[title="${unit_name}"] + *`).first();
    // A click event on the 26th div, like the DOM's click(): the cell needn't be in view
    await row_container.locator("div").nth(25).dispatchEvent("click");
    await log("Clicked the 26th div successfully");
  }

  @step("admin_my_units.Admin Clicks Make Reservation")
  async adminClicksMakeReservation() {
    await this.page.locator('span:has-text("Tee varaus")').click();
  }

  @step("admin_my_units.Admin Checks Make Reservation Button Is Disabled")
  async adminChecksMakeReservationButtonIsDisabled() {
    const make_reservation = this.page.locator('button:has-text("Tee varaus")');

    // Verify button is visible and disabled (the unit's page may still be loading)
    await expect(make_reservation).toBeVisible({ timeout: 15_000 });
    await expect(make_reservation).toBeDisabled({ timeout: 2000 });

    await log("Button is properly disabled for VIEWER role");
  }

  @step("admin_my_units.Admin Selects Unit From Reservation Units Dropdown")
  async adminSelectsUnitFromReservationUnitsDropdown(units_location: string) {
    await this.page.locator('[aria-label*="Varausyksikkö"]').click();
    await this.pages.customKeywords.findAndClickElementWithText("li >> span", units_location);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await this.pages.customKeywords.closeSelectListIfOpen('[aria-haspopup="listbox"][aria-label*="Varausyksikkö"]');
  }
}
