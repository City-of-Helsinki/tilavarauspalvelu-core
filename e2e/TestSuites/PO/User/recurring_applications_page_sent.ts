/** The page that shows after the seasonal application is sent. */
import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { TEXT_CHECK_TIMEOUT } from "../../Resources/variables";

export class RecurringApplicationsPageSent extends PageObject {
  @step("recurring_applications_page_sent.User Checks H1 Of The Sent Page")
  async userChecksH1OfTheSentPage() {
    await expect(this.page.locator("h1")).toHaveText("Kiitos hakemuksesta!", {
      useInnerText: true,
      timeout: TEXT_CHECK_TIMEOUT,
    });
  }
}
