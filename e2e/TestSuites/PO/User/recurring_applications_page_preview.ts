/** A resource file with top navigation keywords. */
import { retry } from "../../../lib/retry";
import { expect, step } from "../../../lib/runtime";
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
    // After a 5xx the app keeps the application a draft and enables the button again, so the send is repeated
    await retry(3, 5000, async () => {
      // Waiting together, so a failed click doesn't leave the response wait unhandled
      const [response] = await Promise.all([
        this.page.waitForResponse((candidate) => (candidate.request().postData() ?? "").includes("SendApplication"), {
          timeout: 30_000,
        }),
        this.page.locator("#button__application--submit").click(),
      ]);
      expect(response.status(), "The backend failed to send the application").toBeLessThan(500);
    });
    // Sending the application opens its sent page
    await this.page.waitForURL((url) => url.pathname.endsWith("/sent"));
  }
}
