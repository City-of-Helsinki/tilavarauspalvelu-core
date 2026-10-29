/** Port of PO/User/singlebooking.robot */
import { reachesState } from "../../../lib/locators";
import { expect, isTruthy, str, step, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { PageObject } from "../../page-object";

export class Singlebooking extends PageObject {
  @step("singlebooking.Search Units By Name")
  async searchUnitsByName(search_text: RobotValue) {
    await this.page.locator("input#search").fill(String(search_text));
    // The search reads the typed text from the input
    await expect(this.page.locator("input#search")).toHaveValue(String(search_text));
    // Click  button[type="submit"]
    await this.page.getByTestId("searchButton").click();
    // Check if actual results are found
    await this.page.getByTestId("list-with-pagination__list--container").waitFor({ state: "visible" });
  }

  @step("singlebooking.Click Searched Unit")
  async clickSearchedUnit(searched_text: RobotValue) {
    // Port: expect waits until the search results are the searched unit only
    await expect(this.page.getByTestId("list-with-pagination__list--container").locator("h2")).toHaveText([
      str(searched_text),
    ]);
    await this.page
      .locator("h2")
      .locator(`text="${str(searched_text)}"`)
      .click();
  }

  /**
   * Ensures the visibility of the search input by clicking the
   * "Advanced Search" toggle button if the search field is not already visible.
   */
  @step("singlebooking.Click Advanced Search If Search Not Visible")
  async clickAdvancedSearchIfSearchNotVisible() {
    let search_visible: RobotValue;
    search_visible = await reachesState(this.page.locator("#search"), "visible", 5000);

    if (!isTruthy(search_visible)) {
      await log("Search input is not visible. Clicking advanced search");
      // Tää ei klikkaa oikeasti
      await this.page.getByTestId("show-all__toggle-button").click();
      await expect(this.page.locator("#search")).toBeVisible({ timeout: 5000 });
    } else {
      await log("Search input is visible. No further action required.");
    }
  }
}
