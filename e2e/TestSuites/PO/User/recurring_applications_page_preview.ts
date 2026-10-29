/** A resource file with top navigation keywords. */
import { step } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class RecurringApplicationsPagePreview extends PageObject {
  @step("recurring_applications_page_preview.User Clicks The Accept Terms Of Use Checkbox")
  async userClicksTheAcceptTermsOfUseCheckbox() {
    await this.page.locator('[id="preview.acceptTermsOfUse-terms-accepted"]').check();
  }

  @step("recurring_applications_page_preview.User Clicks The Specific Terms Of Use Checkbox")
  async userClicksTheSpecificTermsOfUseCheckbox() {
    await this.page.locator('[id="preview.acceptServiceSpecificTerms-terms-accepted"]').check();
  }

  @step("recurring_applications_page_preview.User Clicks The Submit Button")
  async userClicksTheSubmitButton() {
    await this.page.locator("#button__application--submit").click();
    // Sending the application opens its sent page
    await this.page.waitForURL((url) => url.pathname.endsWith("/sent"));
  }
}
