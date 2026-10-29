/** Port of PO/Admin/admin_notifications_create_page.robot */
import { Browser } from "../../../lib/Browser";
import { V, keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/parallel_test_data";

export const admin_notifications_create_page = keywords("admin_notifications_create_page", {
  "Admin Selects Immediate Validity Period": async () => {
    await Browser["Click"]('css=label[for="v-radio1"]');
  },

  "Admin Selects Notification Active Until": async (date: RobotValue) => {
    await Browser["Type Text"]("id=notification-active-until", date);

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
  },

  "Admin Fills Notification Name": async (name: string) => {
    await Browser["Fill Text"]("id=notification-name", name);
  },

  // Ilmoituksen tyyppi
  "Admin Selects Type Of Notification": async (notification_type: string) => {
    await Browser["Click"]('css=[aria-label*="Ilmoituksen tyyppi."]');
    await custom_keywords["Find And Click Element With Text"]("form >> li >> span", notification_type);
    // The button shows the picked option, the list can stay open
    await Browser["Wait For Elements State"](
      `css=[aria-label*="Ilmoituksen tyyppi."] >> text="${notification_type}" >> nth=0`,
      "visible",
      named({ timeout: "5s" })
    );

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
  },

  // Kohderyhmä
  "Admin Selects Target Group All": async () => {
    await Browser["Click"]('css=[aria-label*="Kohderyhmä."]');
    await custom_keywords["Find And Click Element With Text"](
      "form >> li >> span",
      V.NOTIFICATION_BANNER_TARGET_GROUP_ALL
    );
    await Browser["Wait For Elements State"](
      `css=[aria-label*="Kohderyhmä."] >> text="${V.NOTIFICATION_BANNER_TARGET_GROUP_ALL}" >> nth=0`,
      "visible",
      named({ timeout: "5s" })
    );
  },

  "Admin Selects Target Group Admin": async () => {
    await Browser["Click"]('css=[aria-label*="Kohderyhmä."]');
    await custom_keywords["Find And Click Element With Text"](
      "form >> li >> span",
      V.NOTIFICATION_BANNER_TARGET_GROUP_ADMIN
    );
    await Browser["Wait For Elements State"](
      `css=[aria-label*="Kohderyhmä."] >> text="${V.NOTIFICATION_BANNER_TARGET_GROUP_ADMIN}" >> nth=0`,
      "visible",
      named({ timeout: "5s" })
    );
  },

  "Admin Selects Target Group User": async () => {
    await Browser["Click"]('css=[aria-label*="Kohderyhmä."]');
    await custom_keywords["Find And Click Element With Text"](
      "form >> li >> span",
      V.NOTIFICATION_BANNER_TARGET_GROUP_USER
    );
    await Browser["Wait For Elements State"](
      `css=[aria-label*="Kohderyhmä."] >> text="${V.NOTIFICATION_BANNER_TARGET_GROUP_USER}" >> nth=0`,
      "visible",
      named({ timeout: "5s" })
    );
  },

  // Viesti
  "Admin Clicks Notification Text Fi Container": async () => {
    await Browser["Click"]('[data-testid="Notification__Page--message-fi-input"]');
  },

  "Admin Fills Notification Text Fi": async (text_fi: string) => {
    await Browser["Fill Text"]('[data-testid="Notification__Page--message-fi-input"] >> p', text_fi);
  },

  "Admin Fills Notification Text Eng": async (text_eng: RobotValue) => {
    await Browser["Fill Text"]('[data-testid="Notification__Page--message-en-input"]', text_eng);
  },

  "Admin Fills Notification Text Sv": async (text_sv: RobotValue) => {
    await Browser["Fill Text"]('[data-testid="Notification__Page--message-sv-input"]', text_sv);
  },

  "Admin Publishes Notification": async () => {
    await Browser["Click"]('[data-testid="Notification__Page--publish-button"]');
    // Publishing returns to the list page, which has the create link
    await Browser["Wait For Elements State"](
      '[href="/kasittely/notifications/new"]',
      "visible",
      named({
        timeout: "15s",
        message: "Notifications list did not open after publishing - notification publish may have failed",
      })
    );
  },

  "Admin Drafts Notification": async () => {
    await Browser["Click"]('[data-testid="Notification__Page--save-draft-button"]');
    // Saving returns to the list page, which has the create link
    await Browser["Wait For Elements State"](
      '[href="/kasittely/notifications/new"]',
      "visible",
      named({ timeout: "15s" })
    );
  },

  "Admin Deletes Notification": async () => {
    await custom_keywords["Find And Click Element With Text"]("button", V.DELETE_NOTIFICATION_BUTTON_TEXT);
    // Deleting returns to the list page, which has the create link
    await Browser["Wait For Elements State"](
      '[href="/kasittely/notifications/new"]',
      "visible",
      named({ timeout: "15s" })
    );
  },
});
