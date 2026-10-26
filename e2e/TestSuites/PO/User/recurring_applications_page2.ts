/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications_page2 = keywords("recurring_applications_page2", {
  "User Selects Type Of The Booking Request": async (type_of_booking_request_txt: RobotValue) => {
    await Browser["Click"]('css=[aria-label*="Aikatoiveen tyyppi. "]');
    await BuiltIn["Sleep"]("500ms");
    await custom_keywords["Find And Click Element With Text"]("ul >> span", type_of_booking_request_txt);
  },

  "User Clicks Available Seasonal Booking Times For": async (name_of_the_unit: RobotValue) => {
    await Browser["Click"]('css=[aria-label*="Näytä kausivarattavat "]');
    await BuiltIn["Sleep"]("500ms");
    await custom_keywords["Find And Click Element With Text"]("ul >> span", name_of_the_unit);
  },

  "User Selects The Times For Recurring Application": async (selector_for_time_of_the_booking: RobotValue) => {
    await Browser["Click"](selector_for_time_of_the_booking);
    await BuiltIn["Sleep"]("500ms");
  },

  "User Clicks Continue Button": async () => {
    await BuiltIn["Log"]("this is the same in the page 3");
    await custom_keywords["Click And Wait For Page"]("id=button__application--next");
  },
});
