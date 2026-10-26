/** Port of PO/User/reservation_lownav.robot */
import { Browser } from "../../../lib/Browser";
import { keywords } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const reservation_lownav = keywords("reservation_lownav", {
  "Click Submit Button Continue": async () => {
    await Browser["Wait For Elements State"]('[data-testid="reservation__button--continue"]', "enabled");
    await custom_keywords["Click And Wait For Page"]('[data-testid="reservation__button--continue"]');
  },
});
