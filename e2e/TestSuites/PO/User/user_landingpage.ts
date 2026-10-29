/** Port of PO/User/user_landingpage.robot */
import { V, expect, str, timeToMs, step, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/serial_users";
import { PageObject } from "../../page-object";

export class UserLandingpage extends PageObject {
  @step("user_landingpage.Check The User Landing Page H1")
  async checkTheUserLandingPageH1(expected_h1_text: string) {
    // Port: expect retries until the heading has the text, instead of Wait Until Keyword Succeeds
    await expect(this.page.locator("h1")).toContainText(expected_h1_text, {
      timeout: timeToMs(V.BROWSER_TIMEOUT_GLOBAL),
    });
    await log(expected_h1_text);
  }

  @step("user_landingpage.Check The Name In The Login Button")
  async checkTheNameInTheLoginButton() {
    await log(V.BASIC_USER_MALE_FULLNAME);
    await expect(this.page.locator("#userDropdown-button")).toHaveText(V.BASIC_USER_MALE_FULLNAME, {
      useInnerText: true,
    });
  }

  @step("user_landingpage.Check The Interrupted Payment Notification")
  async checkTheInterruptedPaymentNotification(banner_title: RobotValue) {
    await expect(this.page.getByTestId("unpaid-reservation-notification__title")).toHaveText(str(banner_title), {
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
