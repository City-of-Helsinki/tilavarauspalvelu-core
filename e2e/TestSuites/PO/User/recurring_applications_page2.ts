/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications_page2 = keywords("recurring_applications_page2", {
  "User Selects Type Of The Booking Request": async (type_of_booking_request_txt: string) => {
    await Browser["Click"]('css=[aria-label*="Aikatoiveen tyyppi. "]');
    await custom_keywords["Find And Click Element With Text"]("ul >> span", type_of_booking_request_txt);
    // An option picked within 200 ms of opening leaves the HDS Select list open
    await custom_keywords["Close Select List If Open"]('[aria-haspopup="listbox"][aria-label*="Aikatoiveen tyyppi. "]');
  },

  "User Clicks Available Seasonal Booking Times For": async (name_of_the_unit: string) => {
    await Browser["Click"]('css=[aria-label*="Näytä kausivarattavat "]');
    await custom_keywords["Find And Click Element With Text"]("ul >> span", name_of_the_unit);
    await custom_keywords["Close Select List If Open"](
      '[aria-haspopup="listbox"][aria-label*="Näytä kausivarattavat "]'
    );
  },

  "User Selects The Times For Recurring Application": async (selector_for_time_of_the_booking: string) => {
    await Browser["Click"](selector_for_time_of_the_booking);
  },

  "User Clicks Continue Button": async () => {
    await BuiltIn["Log"]("this is the same in the page 3");
    await custom_keywords["Click And Wait For Page"]("id=button__application--next");
  },
});
