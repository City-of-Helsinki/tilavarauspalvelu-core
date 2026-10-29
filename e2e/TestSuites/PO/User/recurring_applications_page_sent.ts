/** A resource file with top navigation keywords. */
import { step } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class RecurringApplicationsPageSent extends PageObject {
  @step("recurring_applications_page_sent.User Checks H1 Of The Sent Page")
  async userChecksH1OfTheSentPage() {
    await this.pages.customKeywords.checkElementsText("h1", "Kiitos hakemuksesta!");
  }
}
