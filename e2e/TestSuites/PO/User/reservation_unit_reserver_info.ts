/** Port of PO/User/reservation_unit_reserver_info.robot */
import { V, expect, step } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class ReservationUnitReserverInfo extends PageObject {
  @step("reservation_unit_reserver_info.Enter First Name")
  async enterFirstName(firstname: string) {
    await this.page.locator("#reservation-form-field__reserveeFirstName").fill(firstname);
  }

  @step("reservation_unit_reserver_info.Enter Last Name")
  async enterLastName(lastname: string) {
    await this.page.locator("#reservation-form-field__reserveeLastName").fill(lastname);
  }

  @step("reservation_unit_reserver_info.Enter Email")
  async enterEmail(email: string) {
    await this.page.locator("#reservation-form-field__reserveeEmail").fill(email);
  }

  @step("reservation_unit_reserver_info.Enter Phone Number")
  async enterPhoneNumber(phonenumber: string) {
    await this.page.locator("#reservation-form-field__reserveePhone").fill(phonenumber);
  }

  @step("reservation_unit_reserver_info.Select Home City")
  async selectHomeCity(homecity: string) {
    const main_button = "#reservation-form-field__municipality-main-button";
    const selected_city = this.page.locator(main_button).locator(`text="${homecity}"`);
    // Clicking the selected city would unselect it
    if ((await selected_city.count()) === 0) {
      await this.page.locator(main_button).click();
      await this.pages.customKeywords.findAndClickElementWithText("li", homecity);
    }
    await selected_city.first().waitFor({ state: "visible", timeout: 5000 });
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  /**
   * Checks for the error notification banner that appears when required
   * fields are missing.
   */
  @step("reservation_unit_reserver_info.Check Application Cannot Be Made Without Info")
  async checkApplicationCannotBeMadeWithoutInfo() {
    await this.page.getByTestId("reservation__button--continue").click();
    // Port: kept on purpose. The form validates and re-renders after the empty submit, and text typed into it at
    // the same time can lose keys (the first name was saved as "Mar" instead of "Marja").
    await this.page.waitForTimeout(1000);

    // Check that error notification banner is displayed
    // The form's own notification, in the page's main content: an error toast (like a 502 from the backend) has the
    // same style
    await expect(this.page.getByRole("main").locator(V.NOTIFICATION_TYPE_ERROR)).toBeVisible();
  }
}
