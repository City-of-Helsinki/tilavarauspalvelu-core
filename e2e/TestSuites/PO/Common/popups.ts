/** Port of PO/Common/popups.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { isTruthy, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";

export const popups = keywords("popups", {
  /**
   * Ensures the visibility of the button with the specified text inside a dialog.
   * If the dialog with role="dialog" is visible, clicks the button.
   * Otherwise, continues the test without failing.
   */
  "User Accepts Cookies If Dialog Is Visible": async (cookie_text: RobotValue) => {
    let dialog_visible: RobotValue;
    dialog_visible = await BuiltIn["Run Keyword And Return Status"](
      Browser["Wait For Elements State"],
      `button:has-text("${str(cookie_text)}")`,
      "stable",
      named({ timeout: "10s" })
    );

    if (isTruthy(dialog_visible)) {
      await BuiltIn["Log"](`Dialog is visible. Checking for the button with text "${str(cookie_text)}".`);
      await Browser["Click"](`.hds-cc__buttons >> button:has-text("${str(cookie_text)}")`);
      await BuiltIn["Log"](`Clicked the "${str(cookie_text)}" button.`);
      await Browser["Wait For Elements State"](".hds-cc__buttons", "hidden", named({ timeout: "5s" }));
    } else {
      await BuiltIn["Log"]("Dialog is not visible. Continuing the test.");
    }
  },

  /**
   * Closes all notification banners by clicking close button
   * and refreshing until no notifications are visible
   */
  "Close Notification Banner If Visible": async () => {
    let attempt: RobotValue, success: RobotValue, notifications_visible: RobotValue;
    attempt = "1";
    success = "False";
    while (true) {
      // Check if notification exists
      notifications_visible = await Browser["Get Element Count"](
        '[data-sentry-component="BannerNotificationsList"] >> [data-testid="BannerNotificationList__Notification"]'
      );
      await BuiltIn["Log"](`Attempt ${str(attempt)}: Found ${str(notifications_visible)} notifications`);

      // Exit if no notifications
      if (Number(notifications_visible) === 0) {
        await BuiltIn["Log"]("No more notifications found. Continuing test.");
        success = "True";
        break;
      }

      // Check if we've reached the limit
      if (Number(attempt) > 5) {
        await BuiltIn["Log"]("Reached maximum attempts (5). Unable to close all notifications.");
        break;
      }

      // Close notification and refresh
      await Browser["Click"]('[data-testid="BannerNotificationList__Notification"] >> button[title="Sulje"] >> nth=0');
      await BuiltIn["Sleep"]("1s");
      await BuiltIn["Log"]("Clicked close button on notification");

      await popups["Reload Page"]();
      attempt = Number(attempt) + 1;
    }
    // If we reach here and success is False, we couldn't close all notifications
    if (!isTruthy(success)) {
      await BuiltIn["Fail"]("Too many notification banners! Please delete extra notifications from admin side.");
    }
  },

  "Reload Page": async () => {
    await Browser["Reload"]();
    await BuiltIn["Sleep"]("2s"); // wait for the page to load
    await Browser["Wait For Load State"]("networkidle", named({ timeout: "30s" }));
  },
});
