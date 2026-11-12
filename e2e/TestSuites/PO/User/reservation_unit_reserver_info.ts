import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { FORM_ERRORS_TITLE_FI } from "../../Resources/texts_FI";

/** The reserver's contact info on the booking form. */
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
    // The button shows the selected city in an element of its own
    const selected_city = this.page.locator(main_button).getByText(homecity, { exact: true });
    // Clicking the selected city would unselect it
    if ((await selected_city.count()) === 0) {
      await this.page.locator(main_button).click();
      await this.page.getByRole("option", { name: homecity, exact: true }).click();
    }
    await selected_city.first().waitFor({ state: "visible", timeout: 5000 });
    await this.pages.customKeywords.closeSelectListIfOpen(main_button);
  }

  /** Clicks continue before the required fields are filled, and checks the error box that the form shows. */
  @step("reservation_unit_reserver_info.Check Application Cannot Be Made Without Info")
  async checkApplicationCannotBeMadeWithoutInfo() {
    await this.page.getByTestId("reservation__button--continue").click();
    // Kept on purpose: the form validates and re-renders after the empty submit, and text typed into it at the
    // same time can lose keys (the first name was saved as "Mar" instead of "Marja").
    await this.page.waitForTimeout(1000);

    // The form's own error box, by its heading in the main content: an error toast (like a backend 502) has the same
    // style but no heading
    await expect(this.page.getByRole("main").getByRole("heading", { name: FORM_ERRORS_TITLE_FI })).toBeVisible();
  }
}
