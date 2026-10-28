/** Port of PO/Common/checkout.robot */
import { Browser, currentPage } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, exceptionMatches, isTruthy, keywords, named, rethrowSkip, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/parallel_test_data";
import "../../Resources/serial_users";
import "../../Resources/variables";
import "../../Resources/texts_FI";

export const checkout = keywords("checkout", {
  "Allow All Cookies If Visible": async () => {
    let consent_saved: RobotValue;
    // The banner is not shown again once the consent is saved
    consent_saved = await Browser["Evaluate JavaScript"](null, () =>
      document.cookie.includes("helfi-cookie-consents=")
    );
    if (isTruthy(consent_saved)) {
      await BuiltIn["Log"]("Cookie consent already saved, the banner is not shown");
      return;
    }
    try {
      await Browser["Wait For Elements State"](
        'css=button[data-approved="required"]',
        "visible",
        named({ timeout: "5s" })
      );
    } catch (err) {
      rethrowSkip(err);
      if (!exceptionMatches(err, "TimeoutError*", "glob")) {
        throw err;
      }
      await BuiltIn["Log"]("Cookie consent button not found, continuing without clicking");
      return;
    }
    // A keyboard press, in the Android emulation the other cookie button blocks a mouse click
    await Browser["Focus"]('css=button[data-approved="required"]');
    await Browser["Keyboard Key"]("press", "Enter");
    await Browser["Wait For Elements State"](
      'css=button[data-approved="required"]',
      "hidden",
      named({ timeout: "5s", message: "The cookie banner did not close" })
    );
    await BuiltIn["Log"]("Cookie consent button found and clicked");
  },

  "Select Payment Method OP": async () => {
    await Browser["Click"]("css=#OP");
  },

  "Click Submit": async () => {
    await Browser["Click"]("css=.submit");
  },

  "Click Accept Terms": async () => {
    await Browser["Click"]("css=#acceptTerms");
  },

  "Check User Details In Checkout": async () => {
    await custom_keywords["Find Text From Elements Or Fail"](
      "css=.customer-details-information >> td",
      V.CURRENT_USER_EMAIL
    );
  },

  "Check Product List Has All The Info": async () => {
    await custom_keywords["Check Elements Text"](
      "css=.product-summary >> span.cart-total.padded",
      V.SINGLEBOOKING_PAID_PRICE_CHECKOUT
    );
  },

  "In Order Summary Get Booking Number From Product List": async () => {
    let element_next_to_varausnumero: RobotValue, reservation_number: RobotValue, BOOKING_NUM_ONLY: RobotValue;
    await Browser["Wait For Elements State"]("css=.product-list", "visible");

    // Get the next sibling element containing the reservation number
    element_next_to_varausnumero = await Browser["Get Element"](
      "xpath=//div[contains(@class, 'product-list')]//div[contains(@class, 'meta-label') and text()='Varausnumero']/following-sibling::div[1]"
    );

    // Extract the text of the next sibling element
    reservation_number = await Browser["Get Text"](element_next_to_varausnumero);

    // Log the reservation number
    await BuiltIn["Log"](`Reservation number: ${str(reservation_number)}`);

    BOOKING_NUM_ONLY = reservation_number;
    V.BOOKING_NUM_ONLY = BOOKING_NUM_ONLY;
    BOOKING_NUM_ONLY = V.BOOKING_NUM_ONLY;
    await BuiltIn["Log"](BOOKING_NUM_ONLY);

    //
    //
  },

  "Check The Info In Checkout": async () => {
    // The checkout opens on its payment method step
    await Browser["Wait For Elements State"]("css=#OP", "visible", named({ timeout: "30s" }));
    await checkout["Allow All Cookies If Visible"]();
    await checkout["Select Payment Method OP"]();
    await checkout["Click Submit"]();
    // Submitting the payment method opens the summary step
    await custom_keywords["Wait For Url To Contain"]("/summary", /* timeout= */ "20s");
    await checkout["Check Product List Has All The Info"]();
    await checkout["In Order Summary Get Booking Number From Product List"]();
    await checkout["Click Accept Terms"]();
    await checkout["Click Submit"]();
    // Submitting the summary goes through the payment back to Varaamo
    await currentPage().waitForURL((url) => url.href.startsWith(str(V.URL_TEST)), { timeout: 50_000 });
  },

  "Url Should Start With": async (prefix: RobotValue) => {
    let url: RobotValue;
    url = await Browser["Get Url"]();
    await BuiltIn["Should Start With"](url, prefix);
  },

  "Interrupted Checkout": async (input_URL: RobotValue) => {
    // The checkout opens on its payment method step
    await Browser["Wait For Elements State"]("css=#OP", "visible", named({ timeout: "30s" }));
    await checkout["Allow All Cookies If Visible"]();
    // Go To waits for the page to load
    await Browser["Go To"](input_URL);
  },
});
