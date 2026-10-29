/** Port of PO/User/reservation_unit_reserver_info.robot */
import { Browser, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, chain, expect, keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const reservation_unit_reserver_info = keywords("reservation_unit_reserver_info", {
  "Enter First Name": async (firstname: string) => {
    await Browser["Type Text"]("id=reservation-form-field__reserveeFirstName", firstname);
  },

  "Enter Last Name": async (lastname: string) => {
    await Browser["Type Text"]("id=reservation-form-field__reserveeLastName", lastname);
  },

  "Enter Email": async (email: string) => {
    await Browser["Type Text"]("id=reservation-form-field__reserveeEmail", email);
  },

  "Enter Phone Number": async (phonenumber: string) => {
    await Browser["Type Text"]("id=reservation-form-field__reserveePhone", phonenumber);
  },

  "Select Home City": async (homecity: string) => {
    let main_button: RobotValue, already_selected: RobotValue;
    main_button = "id=reservation-form-field__municipality-main-button";
    // Clicking the selected city would unselect it
    already_selected = await Browser["Get Element Count"](chain(main_button, `text="${homecity}"`));
    if (Number(already_selected) === 0) {
      await Browser["Click"](main_button);
      await custom_keywords["Find And Click Element With Text"]("li", homecity);
    }
    await Browser["Wait For Elements State"](
      chain(main_button, `text="${homecity}" >> nth=0`),
      "visible",
      named({ timeout: "5s" })
    );
    await custom_keywords["Close Select List If Open"](main_button);
  },

  /**
   * Checks for the error notification banner that appears when required
   * fields are missing.
   */
  "Check Application Cannot Be Made Without Info": async () => {
    await Browser["Click"]('[data-testid="reservation__button--continue"]');
    // Port: kept on purpose. The form validates and re-renders after the empty submit, and text typed into it at
    // the same time can lose keys (the first name was saved as "Mar" instead of "Marja").
    await BuiltIn["Sleep"]("1s");

    // Check that error notification banner is displayed
    await expect(loc(V.NOTIFICATION_TYPE_ERROR)).toBeVisible();
  },
});
