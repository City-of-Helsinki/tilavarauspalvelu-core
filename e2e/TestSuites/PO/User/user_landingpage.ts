/** Port of PO/User/user_landingpage.robot */
import { Browser, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, expect, keywords, str, timeToMs } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/serial_users";

export const user_landingpage = keywords("user_landingpage", {
  "Check The User Landing Page H1": async (expected_h1_text: RobotValue) => {
    // Port: expect retries until the heading has the text, instead of Wait Until Keyword Succeeds
    await expect(loc("css=h1")).toContainText(str(expected_h1_text), { timeout: timeToMs(V.BROWSER_TIMEOUT_GLOBAL) });
    await BuiltIn["Log"](expected_h1_text);
  },

  "Check The Name In The Login Button": async () => {
    await BuiltIn["Log"](V.BASIC_USER_MALE_FULLNAME);
    await expect(loc("id=userDropdown-button")).toHaveText(str(V.BASIC_USER_MALE_FULLNAME), { useInnerText: true });
  },

  "Check The Interrupted Payment Notification": async (banner_title: RobotValue) => {
    await expect(loc('[data-testid="unpaid-reservation-notification__title"]')).toHaveText(str(banner_title), {
      useInnerText: true,
    });
  },

  "Approve Interrupted Payment": async () => {
    await BuiltIn["Log"](
      "Clicking on the first button if previous test runs have failed and there are multiple banners/buttons"
    );
    // The checkout's first step waits for the payment page
    await Browser["Click"]('[data-testid="reservation-notification__button--checkout"] >> nth=0');
  },
});
