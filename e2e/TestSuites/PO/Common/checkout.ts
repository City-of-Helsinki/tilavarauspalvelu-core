import { errors } from "@playwright/test";
import { step, expect, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { SINGLEBOOKING_PAID_PRICE_CHECKOUT } from "../../Resources/texts_FI";
import { TEXT_CHECK_TIMEOUT, URL_TEST } from "../../Resources/variables";

/** Varaamo's reservation page, like /reservations/59472/?notify=confirmed */
const RESERVATION_PAGE_PATH = /\/reservations\/\d+\/?$/;

/**
 * Whether the URL is the page that Varaamo's payment success page opens once the webshop has confirmed the payment.
 * The success page itself isn't: it is a rewrite, so the browser's path stays /success while it polls. Nor are
 * /reservations?error=order1, where a cancelled or denied order goes, and a reservation page opened with
 * notify=polling_timeout, where the success page gave up.
 */
export function isConfirmedReservationUrl(url: URL): boolean {
  return RESERVATION_PAGE_PATH.test(url.pathname) && url.searchParams.get("notify") !== "polling_timeout";
}

/** The external payment page. */
export class Checkout extends PageObject {
  @step("checkout.Allow All Cookies If Visible")
  async allowAllCookiesIfVisible() {
    // The banner is not shown again once the consent is saved
    const consent_saved = await this.page.evaluate(() => document.cookie.includes("helfi-cookie-consents="));
    if (consent_saved) {
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
    await expect(required_only, "The payment page's cookie banner closes").toBeHidden({ timeout: 5000 });
    await log("Cookie consent button found and clicked", { level: "DEBUG" });
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
      this.page.locator(".customer-details-information").locator("td"),
      this.testData.user.email
    );
  }

  @step("checkout.Check Product List Has All The Info")
  async checkProductListHasAllTheInfo() {
    await expect(this.page.locator(".product-summary").locator("span.cart-total.padded")).toHaveText(
      SINGLEBOOKING_PAID_PRICE_CHECKOUT,
      { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT }
    );
  }

  @step("checkout.In Order Summary Get Booking Number From Product List")
  async inOrderSummaryGetBookingNumberFromProductList() {
    await this.page.locator(".product-list").waitFor({ state: "visible" });

    // Get the next sibling element containing the reservation number
    // The checkout is not Varaamo's page: its classes are matched as substrings and the label by its own text node
    const element_next_to_varausnumero = this.page.locator(
      "xpath=//div[contains(@class, 'product-list')]//div[contains(@class, 'meta-label') and text()='Varausnumero']/following-sibling::div[1]"
    );

    // Extract the text of the next sibling element
    const reservation_number = await element_next_to_varausnumero.innerText();

    // Save and log the reservation number
    this.state.bookingNumOnly = reservation_number;
    await log(`Reservation number: ${reservation_number}`);
  }

  @step("checkout.Check The Info In Checkout")
  async checkTheInfoInCheckout() {
    // The checkout opens on its payment method step
    await this.page.locator("#OP").waitFor({ state: "visible", timeout: 30_000 });
    await this.allowAllCookiesIfVisible();
    await this.selectPaymentMethodOp();
    await this.clickSubmit();
    // Submitting the payment method opens the summary step
    await this.pages.customKeywords.waitForUrlToContain("/summary", /* timeout= */ 20_000);
    await this.checkProductListHasAllTheInfo();
    await this.inOrderSummaryGetBookingNumberFromProductList();
    await this.clickAcceptTerms();
    await this.clickSubmit();
    // Submitting the summary goes through the payment back to Varaamo
    await this.page.waitForURL((url) => url.href.startsWith(URL_TEST), { timeout: 50_000 });
    // Varaamo's payment success page (/success) waits up to 30 s for the webshop to confirm the payment, then opens
    // the reservation. The URL stays there until then, so expect retries until it is the reservation's.
    await expect(this.page, "Varaamo confirms the payment and opens the reservation").toHaveURL(
      isConfirmedReservationUrl,
      { timeout: 35_000 }
    );
  }

  @step("checkout.Interrupted Checkout")
  async interruptedCheckout(input_URL: string) {
    // The checkout opens on its payment method step
    await this.page.locator("#OP").waitFor({ state: "visible", timeout: 30_000 });
    await this.allowAllCookiesIfVisible();
    // Go To waits for the page to load
    await this.page.goto(input_URL);
  }
}
