/** Port of PO/Common/checkout.robot */
import { errors } from "@playwright/test";
import { V, isTruthy, str, step, expect, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/parallel_test_data";
import "../../Resources/serial_users";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import { PageObject } from "../../page-object";

export class Checkout extends PageObject {
  @step("checkout.Allow All Cookies If Visible")
  async allowAllCookiesIfVisible() {
    let consent_saved: RobotValue;
    // The banner is not shown again once the consent is saved
    consent_saved = await this.page.evaluate(() => document.cookie.includes("helfi-cookie-consents="));
    if (isTruthy(consent_saved)) {
      await log("Cookie consent already saved, the banner is not shown");
      return;
    }
    const required_only = this.page.locator('button[data-approved="required"]');
    try {
      await required_only.waitFor({ state: "visible", timeout: 5000 });
    } catch (err) {
      if (!(err instanceof errors.TimeoutError)) {
        throw err;
      }
      await log("Cookie consent button not found, continuing without clicking");
      return;
    }
    // A keyboard press, in the Android emulation the other cookie button blocks a mouse click
    await required_only.press("Enter");
    await expect(required_only, "The cookie banner did not close").toBeHidden({ timeout: 5000 });
    await log("Cookie consent button found and clicked");
  }

  @step("checkout.Select Payment Method OP")
  async selectPaymentMethodOp() {
    await this.page.locator("#OP").click();
  }

  @step("checkout.Click Submit")
  async clickSubmit() {
    await this.page.locator(".submit").click();
  }

  @step("checkout.Click Accept Terms")
  async clickAcceptTerms() {
    await this.page.locator("#acceptTerms").click();
  }

  @step("checkout.Check User Details In Checkout")
  async checkUserDetailsInCheckout() {
    await this.pages.customKeywords.findTextFromElementsOrFail(
      ".customer-details-information >> td",
      V.CURRENT_USER_EMAIL
    );
  }

  @step("checkout.Check Product List Has All The Info")
  async checkProductListHasAllTheInfo() {
    await this.pages.customKeywords.checkElementsText(
      ".product-summary >> span.cart-total.padded",
      V.SINGLEBOOKING_PAID_PRICE_CHECKOUT
    );
  }

  @step("checkout.In Order Summary Get Booking Number From Product List")
  async inOrderSummaryGetBookingNumberFromProductList() {
    let element_next_to_varausnumero: RobotValue, reservation_number: RobotValue, BOOKING_NUM_ONLY: RobotValue;
    await this.page.locator(".product-list").waitFor({ state: "visible" });

    // Get the next sibling element containing the reservation number
    // The checkout is not Varaamo's page: its classes are matched as substrings and the label by its own text node
    element_next_to_varausnumero = this.page.locator(
      "xpath=//div[contains(@class, 'product-list')]//div[contains(@class, 'meta-label') and text()='Varausnumero']/following-sibling::div[1]"
    );

    // Extract the text of the next sibling element
    reservation_number = await element_next_to_varausnumero.innerText();

    // Log the reservation number
    await log(`Reservation number: ${str(reservation_number)}`);

    BOOKING_NUM_ONLY = reservation_number;
    V.BOOKING_NUM_ONLY = BOOKING_NUM_ONLY;
    BOOKING_NUM_ONLY = V.BOOKING_NUM_ONLY;
    await log(BOOKING_NUM_ONLY);
  }

  @step("checkout.Check The Info In Checkout")
  async checkTheInfoInCheckout() {
    // The checkout opens on its payment method step
    await this.page.locator("#OP").waitFor({ state: "visible", timeout: 30_000 });
    await this.allowAllCookiesIfVisible();
    await this.selectPaymentMethodOp();
    await this.clickSubmit();
    // Submitting the payment method opens the summary step
    await this.pages.customKeywords.waitForUrlToContain("/summary", /* timeout= */ "20s");
    await this.checkProductListHasAllTheInfo();
    await this.inOrderSummaryGetBookingNumberFromProductList();
    await this.clickAcceptTerms();
    await this.clickSubmit();
    // Submitting the summary goes through the payment back to Varaamo
    await this.page.waitForURL((url) => url.href.startsWith(V.URL_TEST), { timeout: 50_000 });
  }

  @step("checkout.Interrupted Checkout")
  async interruptedCheckout(input_URL: RobotValue) {
    // The checkout opens on its payment method step
    await this.page.locator("#OP").waitFor({ state: "visible", timeout: 30_000 });
    await this.allowAllCookiesIfVisible();
    // Go To waits for the page to load
    await this.page.goto(String(input_URL));
  }
}
