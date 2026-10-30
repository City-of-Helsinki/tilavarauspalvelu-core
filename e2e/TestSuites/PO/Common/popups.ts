/** Port of PO/Common/popups.robot */
import { reachesState } from "../../../lib/locators";
import { step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class Popups extends PageObject {
  /**
   * Ensures the visibility of the button with the specified text inside a dialog.
   * If the dialog with role="dialog" is visible, clicks the button.
   * Otherwise, continues the test without failing.
   */
  @step("popups.User Accepts Cookies If Dialog Is Visible")
  async userAcceptsCookiesIfDialogIsVisible(cookie_text: string) {
    // The cookie banner's button (HDS cookie consent); the name is matched as a substring, like :has-text was
    const accept = this.page.locator(".hds-cc__buttons").getByRole("button", { name: cookie_text });
    // The click below waits for the button to stop moving (the Robot suite waited for "stable" here)
    const dialog_visible = await reachesState(accept, "visible", 10_000);

    if (dialog_visible) {
      await log(`Dialog is visible. Checking for the button with text "${cookie_text}".`);
      await accept.click();
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
    let attempt = 1;
    let success = false;
    while (true) {
      // Check if notification exists. The banners are found by their test id: the list's data-sentry-component
      // attribute isn't rendered in the test environment, so a count inside it always gave 0.
      const notifications_visible = await this.page.getByTestId("BannerNotificationList__Notification").count();
      await log(`Attempt ${attempt}: Found ${notifications_visible} notifications`);

      // Exit if no notifications
      if (notifications_visible === 0) {
        await log("No more notifications found. Continuing test.");
        success = true;
        break;
      }

      // Check if we've reached the limit
      if (attempt > 5) {
        await log("Reached maximum attempts (5). Unable to close all notifications.");
        break;
      }

      // Close notification and refresh
      await this.page
        .getByTestId("BannerNotificationList__Notification")
        .getByRole("button", { name: "Sulje", exact: true })
        .first()
        .click();
      await log("Clicked close button on notification");

      await this.reloadPage();
      attempt++;
    }
    // If we reach here and success is false, we couldn't close all notifications
    if (!success) {
      throw new Error("Too many notification banners! Please delete extra notifications from admin side.");
    }
  }

  @step("popups.Reload Page")
  async reloadPage() {
    await this.page.reload();
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 });
  }
}
