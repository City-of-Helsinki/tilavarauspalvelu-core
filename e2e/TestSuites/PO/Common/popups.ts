/** Port of PO/Common/popups.robot */
import { reachesState } from "../../../lib/locators";
import { isTruthy, str, step, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { PageObject } from "../../page-object";

export class Popups extends PageObject {
  /**
   * Ensures the visibility of the button with the specified text inside a dialog.
   * If the dialog with role="dialog" is visible, clicks the button.
   * Otherwise, continues the test without failing.
   */
  @step("popups.User Accepts Cookies If Dialog Is Visible")
  async userAcceptsCookiesIfDialogIsVisible(cookie_text: string) {
    let dialog_visible: RobotValue;
    // The click below waits for the button to stop moving (the Robot suite waited for "stable" here)
    dialog_visible = await reachesState(this.page.locator(`button:has-text("${cookie_text}")`), "visible", 10_000);

    if (isTruthy(dialog_visible)) {
      await log(`Dialog is visible. Checking for the button with text "${cookie_text}".`);
      await this.page.locator(`.hds-cc__buttons >> button:has-text("${cookie_text}")`).click();
      await log(`Clicked the "${cookie_text}" button.`);
      await this.page.locator(".hds-cc__buttons").waitFor({ state: "hidden", timeout: 5000 });
    } else {
      await log("Dialog is not visible. Continuing the test.");
    }
  }

  /**
   * Closes all notification banners by clicking close button
   * and refreshing until no notifications are visible
   */
  @step("popups.Close Notification Banner If Visible")
  async closeNotificationBannerIfVisible() {
    let attempt: RobotValue, success: RobotValue, notifications_visible: RobotValue;
    attempt = "1";
    success = "False";
    while (true) {
      // Check if notification exists
      notifications_visible = await this.page
        .locator('[data-sentry-component="BannerNotificationsList"]')
        .getByTestId("BannerNotificationList__Notification")
        .count();
      await log(`Attempt ${str(attempt)}: Found ${str(notifications_visible)} notifications`);

      // Exit if no notifications
      if (Number(notifications_visible) === 0) {
        await log("No more notifications found. Continuing test.");
        success = "True";
        break;
      }

      // Check if we've reached the limit
      if (Number(attempt) > 5) {
        await log("Reached maximum attempts (5). Unable to close all notifications.");
        break;
      }

      // Close notification and refresh
      await this.page
        .getByTestId("BannerNotificationList__Notification")
        .locator('button[title="Sulje"]')
        .first()
        .click();
      await log("Clicked close button on notification");

      await this.reloadPage();
      attempt = Number(attempt) + 1;
    }
    // If we reach here and success is False, we couldn't close all notifications
    if (!isTruthy(success)) {
      throw new Error("Too many notification banners! Please delete extra notifications from admin side.");
    }
  }

  @step("popups.Reload Page")
  async reloadPage() {
    await this.page.reload();
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 });
  }
}
