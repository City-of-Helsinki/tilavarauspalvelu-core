/** The seasonal application's preview page: its times, the terms, and sending the application. */
import { retry } from "../../../lib/retry";
import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { sentTimesAsPreviewed } from "../../recurring-times";

export class RecurringApplicationsPagePreview extends PageObject {
  /**
   * Checks the application's times, a row per weekday: the day, its Ensisijaiset times, and its Vaihtoehtoiset times
   * in parentheses, or "-" for none. The times are written as in `recurring-times.ts`, e.g. "To 19:00–21:00 E".
   */
  @step("recurring_applications_page_preview.User Checks The Times")
  async userChecksTheTimes(...times: string[]) {
    // The box's testid ends with the application section's id. Its rows are under its heading.
    const rows = this.page.locator('[data-testid^="time-selector__preview-"] > div > div');
    const expected = sentTimesAsPreviewed(times);
    await expect(rows, "The preview page has a row of times for each weekday").toHaveCount(expected.length);
    for (const [index, row] of expected.entries()) {
      const [day = ""] = row;
      await expect(rows.nth(index).locator("span"), `The preview page's times on ${day}`).toHaveText(row);
    }
  }

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
      expect(response.status(), "Sending the application gets no server error").toBeLessThan(500);
    });
    // Sending the application opens its sent page
    await this.page.waitForURL((url) => url.pathname.endsWith("/sent"));
  }
}
