/** Port of PO/Admin/admin_notifications_create_page.robot */
import { step, expect } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import {
  DELETE_NOTIFICATION_BUTTON_TEXT,
  NOTIFICATION_BANNER_TARGET_GROUP_ADMIN,
  NOTIFICATION_BANNER_TARGET_GROUP_ALL,
  NOTIFICATION_BANNER_TARGET_GROUP_USER,
} from "../../Resources/texts_FI";

export class AdminNotificationsCreatePage extends PageObject {
  /**
   * Picks an option of the form's HDS Select by the select's label. The select's button is a combobox whose name
   * starts with the label, and the options are `option`s named by their text. The button shows the picked option;
   * the list can stay open.
   */
  private async selectOption(label: string, option: string) {
    const select = this.page.getByRole("combobox", { name: label });
    await select.click();
    await this.page.getByRole("option", { name: option, exact: true }).click();
    await expect(select).toContainText(option, { timeout: 5000 });
  }

  @step("admin_notifications_create_page.Admin Selects Immediate Validity Period")
  async adminSelectsImmediateValidityPeriod() {
    await this.page.locator('label[for="v-radio1"]').click();
  }

  @step("admin_notifications_create_page.Admin Selects Notification Active Until")
  async adminSelectsNotificationActiveUntil(date: string) {
    await this.page.locator("#notification-active-until").clear();
    await this.page.locator("#notification-active-until").pressSequentially(date);

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
    await this.selectOption("Ilmoituksen tyyppi.", notification_type);

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
    await this.selectOption("Kohderyhmä.", NOTIFICATION_BANNER_TARGET_GROUP_ALL);
  }

  @step("admin_notifications_create_page.Admin Selects Target Group Admin")
  async adminSelectsTargetGroupAdmin() {
    await this.selectOption("Kohderyhmä.", NOTIFICATION_BANNER_TARGET_GROUP_ADMIN);
  }

  @step("admin_notifications_create_page.Admin Selects Target Group User")
  async adminSelectsTargetGroupUser() {
    await this.selectOption("Kohderyhmä.", NOTIFICATION_BANNER_TARGET_GROUP_USER);
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
  async adminFillsNotificationTextEng(text_eng: string) {
    await this.page.getByTestId("Notification__Page--message-en-input").fill(text_eng);
  }

  @step("admin_notifications_create_page.Admin Fills Notification Text Sv")
  async adminFillsNotificationTextSv(text_sv: string) {
    await this.page.getByTestId("Notification__Page--message-sv-input").fill(text_sv);
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
    await this.page.getByRole("button", { name: DELETE_NOTIFICATION_BUTTON_TEXT, exact: true }).click();
    // Deleting returns to the list page, which has the create link
    await this.page.locator('[href="/kasittely/notifications/new"]').waitFor({ state: "visible", timeout: 15_000 });
  }
}
