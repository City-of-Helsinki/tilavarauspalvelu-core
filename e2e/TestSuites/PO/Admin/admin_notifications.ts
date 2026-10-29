/** Port of PO/Admin/admin_notifications.robot */
import { step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class AdminNotifications extends PageObject {
  @step("admin_notifications.Admin Clicks Create Notification Button")
  async adminClicksCreateNotificationButton() {
    await this.page.locator('[href="/kasittely/notifications/new"]').click();
    await this.page.getByTestId("Notification__Page--publish-button").waitFor({ state: "visible", timeout: 15_000 });
  }

  @step("admin_notifications.Admin Clicks Notification Name")
  async adminClicksNotificationName(notification_name: string) {
    await this.pages.customKeywords.findAndClickElementWithText("tbody >> a", notification_name);
    // The form renders only after the notification has loaded
    await this.page.getByTestId("Notification__Page--publish-button").waitFor({ state: "visible", timeout: 15_000 });
  }

  /** Verifies that a notification with the specified name is NOT present in the notifications list */
  @step("admin_notifications.Admin Verifies Notification Is Not Found")
  async adminVerifiesNotificationIsNotFound(notification_name: string) {
    await this.pages.customKeywords.verifyElementWithTextIsNotFound("tbody >> a", notification_name);
  }
}
