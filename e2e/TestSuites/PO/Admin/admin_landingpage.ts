/** Port of PO/Admin/admin_landingpage.robot */
import { Browser, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, expect, keywords, named, timeToMs } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/serial_users";

export const admin_landingpage = keywords("admin_landingpage", {
  "Checks The Admin Landing Page H1": async (expected_H1_text: string) => {
    // Port: expect retries until the heading has the text, instead of Wait Until Keyword Succeeds
    await expect(loc("css=H1")).toContainText(expected_H1_text, {
      timeout: timeToMs(V.BROWSER_TIMEOUT_GLOBAL),
    });
    // The top navigation renders a moment after the heading, when the user's data has loaded
    await Browser["Wait For Load State"]("networkidle", named({ timeout: "40s" }));
    await BuiltIn["Log"](expected_H1_text);
  },

  "Approve Cookies": async () => {
    await Browser["Click"]("css=.ch2-btn-text-sm");
  },
});
