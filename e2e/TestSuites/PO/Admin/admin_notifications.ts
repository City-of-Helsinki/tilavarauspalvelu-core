/** Port of PO/Admin/admin_notifications.robot */
import { Browser } from "../../../lib/Browser";
import { keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";

export const admin_notifications = keywords("admin_notifications", {
  "Admin Clicks Create Notification Button": async () => {
    await Browser["Wait For Elements State"](
      '[href="/kasittely/notifications/new"]',
      "visible",
      named({ timeout: "15s" })
    );
    await Browser["Click"]('[href="/kasittely/notifications/new"]');
    await Browser["Wait For Elements State"](
      '[data-testid="Notification__Page--publish-button"]',
      "visible",
      named({ timeout: "15s" })
    );
  },

  "Admin Clicks Notification Name": async (notification_name: RobotValue) => {
    await custom_keywords["Find And Click Element With Text"]("tbody >> a", notification_name);
    // The form renders only after the notification has loaded
    await Browser["Wait For Elements State"](
      '[data-testid="Notification__Page--publish-button"]',
      "visible",
      named({ timeout: "15s" })
    );
  },

  /** Verifies that a notification with the specified name is NOT present in the notifications list */
  "Admin Verifies Notification Is Not Found": async (notification_name: RobotValue) => {
    await custom_keywords["Verify Element With Text Is Not Found"]("tbody >> a", notification_name);
  },
});
