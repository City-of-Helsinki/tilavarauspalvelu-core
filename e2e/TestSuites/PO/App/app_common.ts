import type { Page } from "@playwright/test";
import { graphqlErrorsIn } from "../../../lib/responses";
import { step, expect, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BASIC_USER_MALE } from "../../Resources/serial_users";
import {
  ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO,
  ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN,
  COOKIETEXT,
  USER_LANDING_PAGE_H1_TEXT,
} from "../../Resources/texts_FI";
import {
  DOWNLOAD_DIR,
  TEXT_CHECK_TIMEOUT,
  URL_ADMIN,
  URL_DJANGO_ADMIN,
  URL_MAIL,
  URL_TEST,
} from "../../Resources/variables";

/** Workflow keywords of both sides: opening the browsers, logging in and out, banners and pages. */
export class AppCommon extends PageObject {
  // USER TEST SET UP
  // Desktop - iPhone - Android
  // LANGUAGE FI
  @step("app_common.User Opens Desktop Browser To Django Admin")
  async userOpensDesktopBrowserToDjangoAdmin() {
    // Default is chrome
    // setUpBrowserAndOpenUrl waits for the page to load
    await this.pages.devices.setUpBrowserAndOpenUrl(URL_DJANGO_ADMIN, DOWNLOAD_DIR);
    // Check Text  h1  Ylläpito
    // h1 on Ylläpito
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN}
  }

  /** Opens the landing page in the project's browser and device: desktop Chromium, the Pixel 5 or the iPhone 14 */
  @step("app_common.User Opens Browser To Landing Page")
  async userOpensBrowserToLandingPage() {
    await this.pages.devices.setUpBrowserAndOpenUrl(URL_TEST, DOWNLOAD_DIR);
    await this.pages.userLandingpage.checkTheUserLandingPageH1(USER_LANDING_PAGE_H1_TEXT);
  }

  @step("app_common.User Opens Desktop Browser To Mail")
  async userOpensDesktopBrowserToMail() {
    // Default is firefox
    await this.pages.devices.setUpFirefoxDesktopBrowserAndOpenUrl(URL_MAIL, DOWNLOAD_DIR);

    // END OF USER TEST SET UP
  }

  // USER
  @step("app_common.User Logs In With Suomi Fi")
  async userLogsInWithSuomiFi() {
    await this.pages.topnav.clickLogin();
    await this.pages.login.loginSuomiFi(this.testData.user.hetu);
    // Confirms we are on the landing page
    await this.pages.userLandingpage.checkTheUserLandingPageH1(USER_LANDING_PAGE_H1_TEXT);
    await this.pages.popups.userAcceptsCookiesIfDialogIsVisible(COOKIETEXT);
    await this.pages.devices.logCurrentCookies();
  }

  /** This information comes from tunnistamo and is not always available */
  @step("app_common.User Checks Dropdown Menu Has User Info (NOT IN USE)")
  async userChecksDropdownMenuHasUserInfoNotInUse() {
    await this.pages.topnav.checkDropdownMenuHasUserInfo(BASIC_USER_MALE.fullName);
  }

  @step("app_common.User Goes To Landing Page")
  async userGoesToLandingPage() {
    await this.page.goto(URL_TEST);
  }

  @step("app_common.User Logs Out")
  async userLogsOut() {
    await this.pages.topnav.clickUserMenu();
    await this.pages.topnav.clickLogout();
  }

  @step("app_common.User Confirms Log Out")
  async userConfirmsLogOut() {
    await this.pages.topnav.clickLogin();

    // Confirms the logout was success
    await this.page.locator("#social-suomi_fi").waitFor({ state: "visible" });
  }

  @step("app_common.Verify Notification Banner Message")
  async verifyNotificationBannerMessage(notification_banner_message: string, notification_type: string) {
    // A banner of this type: toasts and form errors are HDS notifications with the same type classes
    const banner = this.page
      .getByTestId("BannerNotificationList__Notification")
      .and(this.page.locator(notification_type));
    await banner.waitFor({ state: "visible", timeout: 10_000 });

    await expect(banner).toHaveText(notification_banner_message, { useInnerText: true, timeout: TEXT_CHECK_TIMEOUT });
  }

  /** Fails if a notification banner is shown. Use after the banners have loaded. */
  @step("app_common.Verify Notification Banner Message Is Not Visible")
  async verifyNotificationBannerMessageIsNotVisible() {
    // Kept on purpose: a count of 0 passes at once, but a banner can render a moment after the banners' query has
    // returned, so it gets a second first
    await this.page.waitForTimeout(1000);
    await expect(
      this.page.getByTestId("BannerNotificationList__Notification"),
      "No notification banner shows"
    ).toHaveCount(0);
  }

  // END OF USER
  // TODO enable these steps in the login when the dropdown has user info again
  // topnav.Check dropdown menu has user info  ${BASIC_USER_MALE_FULLNAME}

  // ADMIN TEST SET UP
  // Desktop for now.
  // LANGUAGE FI
  @step("app_common.Admin Opens Desktop Browser To Landing Page")
  async adminOpensDesktopBrowserToLandingPage() {
    // Default is chrome
    // create_data.Create robot test data
    await this.pages.devices.setUpBrowserAndOpenUrl(URL_ADMIN, DOWNLOAD_DIR);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  }

  /**
   * Opens the admin UI in a browser session of its own, like the admin's own computer, while the user stays logged in
   * on theirs. The user's page is kept in `state.pageUserSide`, and `session.switchTo` goes back to it.
   */
  @step("app_common.Admin Opens Own Browser To Landing Page")
  async adminOpensOwnBrowserToLandingPage() {
    this.state.pageUserSide = this.page;
    // A second setUpBrowserAndOpenUrl in a test opens a new context
    await this.pages.devices.setUpBrowserAndOpenUrl(URL_ADMIN, DOWNLOAD_DIR);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  }

  @step("app_common.Admin Goes To Landing Page")
  async adminGoesToLandingPage() {
    // goto waits for the page to load
    await this.page.goto(URL_ADMIN);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  }

  /** For a test that starts with a saved admin login, like the notification tests (notifications_login.setup.ts). */
  @step("app_common.Admin Goes To Landing Page Logged In")
  async adminGoesToLandingPageLoggedIn() {
    // goto waits for the page to load
    await this.page.goto(URL_ADMIN);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO);
  }

  @step("app_common.Admin Logs In With Suomi Fi")
  async adminLogsInWithSuomiFi() {
    await this.pages.topnav.clickLoginAdminSide();
    await this.pages.login.loginSuomiFi(this.testData.admin.hetu);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO);
    // Wait For Elements State  id=user-menu  visible
    // TODO enable these steps when the dropdown has user info again
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN}
    // Sleep  3s
    // topnav.Check dropdown menu has user info  ${BASIC_ADMIN_MALE_FULLNAME}
  }

  /**
   * Logs in the permission target admin (Marika Salminen) for permission tests
   * This is the admin whose permissions are being modified and verified
   */
  @step("app_common.Permission Target Admin Logs In With Suomi Fi")
  async permissionTargetAdminLogsInWithSuomiFi() {
    await this.pages.topnav.clickLoginAdminSide();
    await this.pages.login.loginSuomiFi(this.testData.permissionTarget.hetu);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO);
    // Wait For Elements State  id=user-menu  visible
    // TODO enable these steps when the dropdown has user info again
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN}
    // Sleep  3s
    // topnav.Check dropdown menu has user info  ${BASIC_ADMIN_MALE_FULLNAME}
  }

  @step("app_common.Admin Logs Out")
  async adminLogsOut() {
    await this.pages.topnav.clickUserMenu();
    await this.pages.topnav.clickLogoutAdminSide();
    // TODO enable these steps when the dropdown has user info again
    // custom_keywords.Check text of element with logging  p  ${USER_LOGOUT_TEXT}
  }

  @step("app_common.Admin Opens Desktop Browser To Django Admin")
  async adminOpensDesktopBrowserToDjangoAdmin() {
    // Default is chrome
    // setUpBrowserAndOpenUrl waits for the page to load
    await this.pages.devices.setUpBrowserAndOpenUrl(URL_DJANGO_ADMIN, DOWNLOAD_DIR);
    // Check Text  h1  Ylläpito
    // h1 on Ylläpito
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN}
  }

  @step("app_common.Admin Navigates To Django Admin")
  async adminNavigatesToDjangoAdmin() {
    // Default is chrome
    // goto waits for the page to load
    await this.page.goto(URL_DJANGO_ADMIN);

    // END OF ADMIN TEST SET UP
  }

  // SWITCH PAGE
  @step("app_common.Switch To New Tab From Current Page")
  async switchToNewTabFromCurrentPage() {
    const page1 = this.page;
    await log(page1.url());
    await this.session.switchTo(this.session.latestPage());
    await this.page.waitForLoadState("load", { timeout: 15_000 });
  }

  @step("app_common.Open New Window From Admin Side To User Side And Saves Both Windows")
  async openNewWindowFromAdminSideToUserSideAndSavesBothWindows(url: string) {
    // Save the current page
    const admin_page: Page = this.page;
    this.state.pageAdminSide = admin_page;
    await log(`Admin page is ${admin_page.url()}`);

    // Open the user side page in a brand new tab
    const user_page: Page = await this.session.newPage();
    // goto waits for the page to load
    await user_page.goto(url);
    // Finish loading the user side first, switching back too early logged the admin out
    await this.reloadPageAndWaitForBannerNotifications();

    // Save the new page
    this.state.pageUserSide = user_page;
    await log(`User page is ${user_page.url()}`);
  }

  /** Sets up two separate browsers: Firefox for Django admin and Chromium for app admin */
  @step("app_common.Open Django Admin In Firefox And App Admin In Chromium")
  async openDjangoAdminInFirefoxAndAppAdminInChromium(django_url: string, app_url: string) {
    // Set up Firefox browser for Django admin
    await this.pages.devices.setUpFirefoxDesktopBrowserAndOpenUrl(django_url, DOWNLOAD_DIR);

    // Save the Firefox page
    this.state.browserAdminSide = this.page;
    await log(`Django admin (Firefox) page is ${this.page.url()}`);

    // Set up Chromium browser for app admin
    await this.pages.devices.setUpBrowserAndOpenUrl(app_url, DOWNLOAD_DIR);

    // Save the Chromium page
    this.state.browserUserSide = this.page;
    await log(`App admin (Chromium) page is ${this.page.url()}`);
  }

  @step("app_common.Reload Page")
  async reloadPage() {
    await this.page.reload();
    // Network idle on purpose: the pages load more data after the load event, like the admin menu's own units link,
    // and the checks after a reload need all of it
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 });
  }

  /**
   * Reloads and waits until banners are loaded, so "not visible" checks can be trusted.
   * Waits for ShowNotificationsList (customer side) or BannerNotificationsList (admin notifications list page).
   */
  @step("app_common.Reload Page And Wait For Banner Notifications")
  async reloadPageAndWaitForBannerNotifications() {
    // Only requests started after the reload count, the previous page's request must not end the wait
    const reload_started = Date.now();
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          candidate.request().timing().startTime >= reload_started &&
          candidate.url().includes("/graphql") &&
          /ShowNotificationsList|BannerNotificationsList/.test(candidate.request().postData() ?? ""),
        { timeout: 20_000 }
      ),
      this.page.reload(),
    ]);
    // A failed query shows no banners, which would let "not visible" checks pass for the wrong reason
    expect(response.ok(), `The banner query succeeds (HTTP ${response.status()})`).toBe(true);
    expect(await graphqlErrorsIn(response, 20_000), "The banner query has no errors").toBe(false);

    // END OF SWITCH PAGE
  }
}
