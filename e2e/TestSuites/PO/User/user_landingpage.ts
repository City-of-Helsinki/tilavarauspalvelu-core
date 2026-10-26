/** Port of PO/User/user_landingpage.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/serial_users";

export const user_landingpage = keywords("user_landingpage", {
  "Check The User Landing Page H1": async (expected_h1_text: RobotValue) => {
    await BuiltIn["Wait Until Keyword Succeeds"](
      V.BROWSER_TIMEOUT_GLOBAL,
      "250ms",
      user_landingpage["Landing Page H1 Should Contain"],
      expected_h1_text
    );
    await BuiltIn["Log"](expected_h1_text);
  },

  "Landing Page H1 Should Contain": async (expected_h1_text: RobotValue) => {
    let landingPageH1: RobotValue;
    await Browser["Wait For Elements State"]("css=h1", "visible", named({ timeout: "15s" }));
    landingPageH1 = await Browser["Get Text"]("css=h1");
    await BuiltIn["Should Contain"](landingPageH1, expected_h1_text);
  },

  "Check The Name In The Login Button": async () => {
    let TOPNAV_LOGIN_BUTTON_TEXT: RobotValue;
    await BuiltIn["Log"](V.BASIC_USER_MALE_FULLNAME);
    TOPNAV_LOGIN_BUTTON_TEXT = await Browser["Get Text"]("id=userDropdown-button");
    await BuiltIn["Log"](TOPNAV_LOGIN_BUTTON_TEXT);
    await BuiltIn["Should Be Equal"](TOPNAV_LOGIN_BUTTON_TEXT, V.BASIC_USER_MALE_FULLNAME);
  },

  "Check The Interrupted Payment Notification": async (banner_title: RobotValue) => {
    let PAYMENT_NOTIFICATION_TITLE: RobotValue;
    PAYMENT_NOTIFICATION_TITLE = await Browser["Get Text"]('[data-testid="unpaid-reservation-notification__title"]');
    await BuiltIn["Should Be Equal"](PAYMENT_NOTIFICATION_TITLE, banner_title);
  },

  "Approve Interrupted Payment": async () => {
    await BuiltIn["Log"](
      "Clicking on the first button if previous test runs have failed and there are multiple banners/buttons"
    );
    await Browser["Click"]('[data-testid="reservation-notification__button--checkout"] >> nth=0');
    await BuiltIn["Sleep"]("3s"); // Wait for loading
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },
});
