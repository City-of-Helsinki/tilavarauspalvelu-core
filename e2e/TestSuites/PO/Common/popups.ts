import { reachesState } from "../../../lib/locators";
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { COOKIE_CONSENT_COOKIE } from "../../Resources/variables";

/** What can show over any page: the cookie banner, toasts and banner notifications. */
export class Popups extends PageObject {
  /**
   * Clicks the cookie banner's button with this text if the banner shows, and goes on if it doesn't. Doesn't wait for
   * the banner when the consent is already saved.
   */
  @step("popups.User Accepts Cookies If Dialog Is Visible")
  async userAcceptsCookiesIfDialogIsVisible(cookie_text: string) {
    // The banner shows only until the consent is saved in its cookie, so with the cookie there is nothing to wait for
    const consent_saved = (await this.page.context().cookies(this.page.url())).some(
      (cookie) => cookie.name === COOKIE_CONSENT_COOKIE
    );
    if (consent_saved) {
      await log("The cookie consent is already saved in this browser, so the dialog doesn't show");
      return;
    }

    // The cookie banner's button (HDS cookie consent). Its name is matched as a substring.
    const accept = this.page.locator(".hds-cc__buttons").getByRole("button", { name: cookie_text });
    // The click below waits for the button to stop moving
    const dialog_visible = await reachesState(accept, "visible", 10_000);

    if (dialog_visible) {
      await log(`Dialog is visible. Checking for the button with text "${cookie_text}".`, { level: "DEBUG" });
      await accept.click();
      await log(`Clicked the "${cookie_text}" button.`, { level: "DEBUG" });
      await this.page.locator(".hds-cc__buttons").waitFor({ state: "hidden", timeout: 5000 });
    } else {
      await log("Dialog is not visible. Continuing the test.");
    }
  }

  /**
   * Checks the toast that an action shows and closes it. Until it closes itself after 5 s, a toast covers the header's
   * top-right buttons (the phone's Menu, the admin's user menu), and a click on them waits for it.
   */
  @step("popups.Check And Close The Toast")
  async checkAndCloseTheToast(toast_text: string) {
    const toast = this.page.locator(".Toastify__toast").filter({ hasText: toast_text }).first();
    await expect(toast, `The toast "${toast_text}" shows`).toBeVisible();
    try {
      await toast.getByRole("button", { name: "close" }).click({ timeout: 5000 });
    } catch (err) {
      // The toast can close itself just before the click
      if (await toast.isVisible()) {
        throw err;
      }
    }
    await expect(toast, `The toast "${toast_text}" is closed`).toBeHidden();
  }

  /** Closes the notification banners one at a time, reloading after each, and fails if some still show after 5. */
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
      await log("Clicked close button on notification", { level: "DEBUG" });

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
