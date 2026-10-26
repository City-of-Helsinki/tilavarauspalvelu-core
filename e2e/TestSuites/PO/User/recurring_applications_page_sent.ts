/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { keywords } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications_page_sent = keywords("recurring_applications_page_sent", {
  "User Checks H1 Of The Sent Page": async () => {
    await Browser["Get Text"]("h1", "==", "Kiitos hakemuksesta!");
    await custom_keywords["Check Elements Text"]("h1", "Kiitos hakemuksesta!");
  },

  "User Clicks The Specific Terms Of Use Checkbox": async () => {
    await Browser["Click"]("id=preview.acceptServiceSpecificTerms-terms-accepted");
  },
});
