/** Port of PO/User/reservation_lownav.robot */
import { step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class ReservationLownav extends PageObject {
  @step("reservation_lownav.Click Submit Button Continue")
  async clickSubmitButtonContinue() {
    // The click waits until the button is enabled
    await this.pages.customKeywords.clickAndWaitForPage(this.page.getByTestId("reservation__button--continue"));
  }
}
