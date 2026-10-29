/** Port of PO/User/reservation_lownav.robot */
import { step } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class ReservationLownav extends PageObject {
  @step("reservation_lownav.Click Submit Button Continue")
  async clickSubmitButtonContinue() {
    // The click waits until the button is enabled
    await this.pages.customKeywords.clickAndWaitForPage('[data-testid="reservation__button--continue"]');
  }
}
