/** Port of PO/Admin/admin_notifications_create_page.robot */
import { V, step, expect } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";
import { PageObject } from "../../page-object";

export class AdminNotificationsCreatePage extends PageObject {
  @step("admin_notifications_create_page.Admin Selects Immediate Validity Period")
  async adminSelectsImmediateValidityPeriod() {
    await this.page.locator('label[for="v-radio1"]').click();
  }

  @step("admin_notifications_create_page.Admin Selects Notification Active Until")
  async adminSelectsNotificationActiveUntil(date: RobotValue) {
    await this.page.locator("#notification-active-until").clear();
    await this.page.locator("#notification-active-until").pressSequentially(String(date));

    // Admin clicks notification active until time label
    // Click  id=notification-active-until-time-label
    // Sleep  500ms

    // Admin clicks notification active until time
    // Click  id=notification-active-until-time
    // Sleep  500ms

    // Admin clicks notification active until time hours
    // Click  id=notification-active-until-time-hours
    // Sleep  500ms

    // Admin clicks notification active until time minutes
    // Click  id=notification-active-until-time-minutes
    // Sleep  500ms
  }

  @step("admin_notifications_create_page.Admin Fills Notification Name")
  async adminFillsNotificationName(name: string) {
    await this.page.locator("#notification-name").fill(name);
  }

  // Ilmoituksen tyyppi
  @step("admin_notifications_create_page.Admin Selects Type Of Notification")
  async adminSelectsTypeOfNotification(notification_type: string) {
    await this.page.locator('[aria-label*="Ilmoituksen tyyppi."]').click();
    await this.pages.customKeywords.findAndClickElementWithText("form >> li >> span", notification_type);
    // The button shows the picked option, the list can stay open
    await this.page
      .locator('[aria-label*="Ilmoituksen tyyppi."]')
      .locator(`text="${notification_type}"`)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });

    // Admin selects type of notification warning
    // Click  css=[aria-label*="Ilmoituksen tyyppi."]
    // Sleep  500ms
    // custom_keywords.Find and click element with text  form >> li >> span  ${NOTIFICATION_BANNER_MESSAGE_WARNING}
    // Sleep  500ms

    // Admin selects type of notification critical
    // Click  css=[aria-label*="Ilmoituksen tyyppi."]
    // Sleep  500ms
    // custom_keywords.Find and click element with text  form >> li >> span  ${NOTIFICATION_BANNER_MESSAGE_ERROR}
    // Sleep  500ms
  }

  // Kohderyhmä
  @step("admin_notifications_create_page.Admin Selects Target Group All")
  async adminSelectsTargetGroupAll() {
    await this.page.locator('[aria-label*="Kohderyhmä."]').click();
    await this.pages.customKeywords.findAndClickElementWithText(
      "form >> li >> span",
      V.NOTIFICATION_BANNER_TARGET_GROUP_ALL
    );
    await this.page
      .locator('[aria-label*="Kohderyhmä."]')
      .locator(`text="${V.NOTIFICATION_BANNER_TARGET_GROUP_ALL}"`)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  @step("admin_notifications_create_page.Admin Selects Target Group Admin")
  async adminSelectsTargetGroupAdmin() {
    await this.page.locator('[aria-label*="Kohderyhmä."]').click();
    await this.pages.customKeywords.findAndClickElementWithText(
      "form >> li >> span",
      V.NOTIFICATION_BANNER_TARGET_GROUP_ADMIN
    );
    await this.page
      .locator('[aria-label*="Kohderyhmä."]')
      .locator(`text="${V.NOTIFICATION_BANNER_TARGET_GROUP_ADMIN}"`)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  @step("admin_notifications_create_page.Admin Selects Target Group User")
  async adminSelectsTargetGroupUser() {
    await this.page.locator('[aria-label*="Kohderyhmä."]').click();
    await this.pages.customKeywords.findAndClickElementWithText(
      "form >> li >> span",
      V.NOTIFICATION_BANNER_TARGET_GROUP_USER
    );
    await this.page
      .locator('[aria-label*="Kohderyhmä."]')
      .locator(`text="${V.NOTIFICATION_BANNER_TARGET_GROUP_USER}"`)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  // Viesti
  @step("admin_notifications_create_page.Admin Clicks Notification Text Fi Container")
  async adminClicksNotificationTextFiContainer() {
    await this.page.getByTestId("Notification__Page--message-fi-input").click();
  }

  @step("admin_notifications_create_page.Admin Fills Notification Text Fi")
  async adminFillsNotificationTextFi(text_fi: string) {
    await this.page.getByTestId("Notification__Page--message-fi-input").locator("p").fill(text_fi);
  }

  @step("admin_notifications_create_page.Admin Fills Notification Text Eng")
  async adminFillsNotificationTextEng(text_eng: RobotValue) {
    await this.page.getByTestId("Notification__Page--message-en-input").fill(String(text_eng));
  }

  @step("admin_notifications_create_page.Admin Fills Notification Text Sv")
  async adminFillsNotificationTextSv(text_sv: RobotValue) {
    await this.page.getByTestId("Notification__Page--message-sv-input").fill(String(text_sv));
  }

  @step("admin_notifications_create_page.Admin Publishes Notification")
  async adminPublishesNotification() {
    await this.page.getByTestId("Notification__Page--publish-button").click();
    // Publishing returns to the list page, which has the create link
    await expect(
      this.page.locator('[href="/kasittely/notifications/new"]'),
      "Notifications list did not open after publishing - notification publish may have failed"
    ).toBeVisible({ timeout: 15_000 });
  }

  @step("admin_notifications_create_page.Admin Drafts Notification")
  async adminDraftsNotification() {
    await this.page.getByTestId("Notification__Page--save-draft-button").click();
    // Saving returns to the list page, which has the create link
    await this.page.locator('[href="/kasittely/notifications/new"]').waitFor({ state: "visible", timeout: 15_000 });
  }

  @step("admin_notifications_create_page.Admin Deletes Notification")
  async adminDeletesNotification() {
    await this.pages.customKeywords.findAndClickElementWithText("button", V.DELETE_NOTIFICATION_BUTTON_TEXT);
    // Deleting returns to the list page, which has the create link
    await this.page.locator('[href="/kasittely/notifications/new"]').waitFor({ state: "visible", timeout: 15_000 });
  }
}
