/** Port of PO/Admin/admin_landingpage.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/serial_users";

export const admin_landingpage = keywords("admin_landingpage", {
  "Checks The Admin Landing Page H1": async (expected_H1_text: RobotValue) => {
    await BuiltIn["Wait Until Keyword Succeeds"](
      V.BROWSER_TIMEOUT_GLOBAL,
      "250ms",
      admin_landingpage["Admin Landing Page H1 Should Contain"],
      expected_H1_text
    );
    // The top navigation renders a moment after the heading
    await BuiltIn["Sleep"]("2s");
    await Browser["Wait For Load State"]("networkidle", named({ timeout: "40s" }));
    await BuiltIn["Log"](expected_H1_text);
  },

  "Admin Landing Page H1 Should Contain": async (expected_H1_text: RobotValue) => {
    let landingPageH1: RobotValue;
    await Browser["Wait For Elements State"]("css=H1", "stable", named({ timeout: "5s" }));
    landingPageH1 = await Browser["Get Text"]("css=H1");
    await BuiltIn["Should Contain"](landingPageH1, expected_H1_text, named({ strip_spaces: "true" }));
  },

  "Approve Cookies": async () => {
    await Browser["Wait For Elements State"]("css=.ch2-btn-text-sm", "visible");
    await Browser["Click"]("css=.ch2-btn-text-sm");
  },
});
