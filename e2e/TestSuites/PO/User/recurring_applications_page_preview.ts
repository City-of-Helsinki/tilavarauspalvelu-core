/** A resource file with top navigation keywords. */
import { Browser, currentPage } from "../../../lib/Browser";
import { keywords } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications_page_preview = keywords("recurring_applications_page_preview", {
  "User Clicks The Accept Terms Of Use Checkbox": async () => {
    await Browser["Click"]("id=preview.acceptTermsOfUse-terms-accepted");
  },

  "User Clicks The Specific Terms Of Use Checkbox": async () => {
    await Browser["Click"]("id=preview.acceptServiceSpecificTerms-terms-accepted");
  },

  "User Clicks The Submit Button": async () => {
    await Browser["Click"]("id=button__application--submit");
    // Sending the application opens its sent page
    await currentPage().waitForURL((url) => url.pathname.endsWith("/sent"));
  },
});
