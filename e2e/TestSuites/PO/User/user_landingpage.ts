/** Port of PO/User/user_landingpage.robot */
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BASIC_USER_MALE } from "../../Resources/serial_users";
import { BROWSER_TIMEOUT_GLOBAL } from "../../Resources/variables";

export class UserLandingpage extends PageObject {
  @step("user_landingpage.Check The User Landing Page H1")
  async checkTheUserLandingPageH1(expected_h1_text: string) {
    // Port: expect retries until the heading has the text, instead of Wait Until Keyword Succeeds
    await expect(this.page.locator("h1")).toContainText(expected_h1_text, {
      timeout: BROWSER_TIMEOUT_GLOBAL,
    });
    await log(expected_h1_text);
  }

  @step("user_landingpage.Check The Name In The Login Button")
  async checkTheNameInTheLoginButton() {
    await log(BASIC_USER_MALE.fullName);
    await expect(this.page.locator("#userDropdown-button")).toHaveText(BASIC_USER_MALE.fullName, {
      useInnerText: true,
    });
  }

  @step("user_landingpage.Check The Interrupted Payment Notification")
  async checkTheInterruptedPaymentNotification(banner_title: string) {
    await expect(this.page.getByTestId("unpaid-reservation-notification__title")).toHaveText(banner_title, {
      useInnerText: true,
    });
  }

  @step("user_landingpage.Approve Interrupted Payment")
  async approveInterruptedPayment() {
    await log("Clicking on the first button if previous test runs have failed and there are multiple banners/buttons");
    // The checkout's first step waits for the payment page
    await this.page.getByTestId("reservation-notification__button--checkout").first().click();
  }
}
