import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BASIC_USER_MALE } from "../../Resources/serial_users";
import { BROWSER_TIMEOUT_GLOBAL } from "../../Resources/variables";

/** The customer site's landing page, with the banner of an unpaid booking. */
export class UserLandingpage extends PageObject {
  @step("user_landingpage.Check The User Landing Page H1")
  async checkTheUserLandingPageH1(expected_h1_text: string) {
    // expect retries until the heading has the text
    await expect(this.page.locator("h1")).toContainText(expected_h1_text, {
      timeout: BROWSER_TIMEOUT_GLOBAL,
    });
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
    await log("Clicking on the first button if previous test runs have failed and there are multiple banners/buttons", {
      level: "DEBUG",
    });
    const checkout_button = this.page.getByTestId("reservation-notification__button--checkout").first();
    // The banner's query runs once per page load, so when the backend fails it (a 502), the page is reloaded
    await this.pages.customKeywords.retryWithRecovery(
      async () => {
        await expect(checkout_button, 'The "Varauksesi on keskeneräinen" banner shows its payment button').toBeVisible({
          timeout: 5000,
        });
      },
      async () => {
        await this.page.reload();
      }
    );
    // The checkout's first step waits for the payment page
    await checkout_button.click();
  }
}
