import type { Page } from "@playwright/test";
/** Port of PO/App/app_common.robot */
import { graphqlErrorsIn } from "../../../lib/responses";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/create_data";
import "../../Resources/parallel_test_data";
import { V, step, expect, log } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { PageObject } from "../../page-object";

export class AppCommon extends PageObject {
  // USER TEST SET UP
  // Desktop - iPhone - Android
  // LANGUAGE FI
  @step("app_common.User Opens Desktop Browser To Django Admin")
  async userOpensDesktopBrowserToDjangoAdmin() {
    // Default is chrome
    // Set Up … And Open Url waits for the page to load
    await this.pages.devices.setUpChromiumDesktopBrowserAndOpenUrl(V.URL_DJANGO_ADMIN, V.DOWNLOAD_DIR);
    // Check Text  h1  Ylläpito
    // h1 on Ylläpito
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN}
  }

  @step("app_common.User Opens Desktop Browser To Landing Page")
  async userOpensDesktopBrowserToLandingPage() {
    // Default is chrome

    await this.pages.devices.setUpChromiumDesktopBrowserAndOpenUrl(V.URL_TEST, V.DOWNLOAD_DIR);
    await this.pages.userLandingpage.checkTheUserLandingPageH1(V.USER_LANDING_PAGE_H1_TEXT);
  }

  @step("app_common.User Opens Iphone Webkit To Landing Page")
  async userOpensIphoneWebkitToLandingPage() {
    await this.pages.devices.setUpIphone14AndOpenUrl(V.URL_TEST);
    await this.pages.userLandingpage.checkTheUserLandingPageH1(V.USER_LANDING_PAGE_H1_TEXT);
  }

  @step("app_common.User Opens Android Chrome To Landing Page")
  async userOpensAndroidChromeToLandingPage() {
    await this.pages.devices.setUpAndroidPixel5AndOpenUrl(V.URL_TEST);
    await this.pages.userLandingpage.checkTheUserLandingPageH1(V.USER_LANDING_PAGE_H1_TEXT);
  }

  @step("app_common.User Opens Desktop Browser To Mail")
  async userOpensDesktopBrowserToMail() {
    // Default is firefox
    await this.pages.devices.setUpFirefoxDesktopBrowserAndOpenUrl(V.URL_MAIL, V.DOWNLOAD_DIR);

    // END OF USER TEST SET UP
  }

  // USER
  @step("app_common.User Logs In With Suomi Fi")
  async userLogsInWithSuomiFi() {
    await this.pages.topnav.clickLogin();
    await this.pages.login.loginSuomiFi(V.CURRENT_USER_HETU);
    // Confirms we are on the landing page
    await this.pages.userLandingpage.checkTheUserLandingPageH1(V.USER_LANDING_PAGE_H1_TEXT);
    await this.pages.popups.userAcceptsCookiesIfDialogIsVisible(V.COOKIETEXT);
    await this.pages.devices.logCurrentCookies();
  }

  /** This information comes from tunnistamo and is not always available */
  @step("app_common.User Checks Dropdown Menu Has User Info (NOT IN USE)")
  async userChecksDropdownMenuHasUserInfoNotInUse() {
    await this.pages.topnav.checkDropdownMenuHasUserInfo(V.BASIC_USER_MALE_FULLNAME);
  }

  @step("app_common.User Goes To Landing Page")
  async userGoesToLandingPage() {
    await this.page.goto(V.URL_TEST);
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
    await this.page.locator(`section${notification_type}`).waitFor({ state: "visible", timeout: 10_000 });

    await this.pages.customKeywords.checkElementsText(`section${notification_type}`, notification_banner_message);
  }

  /** Fails if a notification banner is shown. Use after the banners have loaded. */
  @step("app_common.Verify Notification Banner Message Is Not Visible")
  async verifyNotificationBannerMessageIsNotVisible() {
    // Port: kept on purpose. The banners' query has returned, and when no banner should show there is nothing to
    // wait for, so a banner that renders a moment late gets a second before the count.
    await this.page.waitForTimeout(1000);
    await expect(
      this.page.getByTestId("BannerNotificationList__Notification"),
      "A notification banner is visible but should not be"
    ).toHaveCount(0);
  }

  // Mobile
  @step("app_common.User Logs Out Mobile")
  async userLogsOutMobile() {
    await this.pages.topnav.clickNavigationMenuMobile();
    await this.pages.topnav.clickUserMenuMobile();
    await this.pages.topnav.clickLogoutMobile();
  }

  @step("app_common.User Confirms Log Out Mobile")
  async userConfirmsLogOutMobile() {
    await this.pages.topnav.clickNavigationMenuMobile();
    await this.pages.topnav.clickLoginMobile();

    // Confirms the logout was success
    await this.page.locator("#social-suomi_fi").waitFor({ state: "visible" });
  }

  @step("app_common.User Logs In With Suomi Fi Mobile")
  async userLogsInWithSuomiFiMobile() {
    await this.pages.topnav.clickNavigationMenuMobile();
    await this.pages.topnav.clickLoginMobile();
    // login.Login Suomi_fi mobile  ${BASIC_USER_MALE_HETU}
    await this.pages.login.loginSuomiFiMobile(V.CURRENT_USER_HETU);

    // Confirms the login was success
    await this.pages.userLandingpage.checkTheUserLandingPageH1(V.USER_LANDING_PAGE_H1_TEXT);
    await this.pages.popups.userAcceptsCookiesIfDialogIsVisible(V.COOKIETEXT);

    // Sleep  3s
    // TODO enable these steps when the dropdown has user info again
    // topnav.Check dropdown menu has user info  ${BASIC_USER_MALE_FULLNAME}

    // END OF USER
  }

  // ADMIN TEST SET UP
  // Desktop for now.
  // LANGUAGE FI
  @step("app_common.Admin Opens Desktop Browser To Landing Page")
  async adminOpensDesktopBrowserToLandingPage() {
    // Default is chrome
    // create_data.Create robot test data
    await this.pages.devices.setUpChromiumDesktopBrowserAndOpenUrl(V.URL_ADMIN, V.DOWNLOAD_DIR);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(V.ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  }

  @step("app_common.Admin Goes To Landing Page")
  async adminGoesToLandingPage() {
    // Go To waits for the page to load
    await this.page.goto(V.URL_ADMIN);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(V.ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  }

  @step("app_common.Admin Logs In With Suomi Fi")
  async adminLogsInWithSuomiFi() {
    await this.pages.topnav.clickLoginAdminSide();
    await this.pages.login.loginSuomiFi(V.ADMIN_CURRENT_USER_HETU);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(
      V.ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO
    );
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
    await this.pages.login.loginSuomiFi(V.PERMISSION_TARGET_ADMIN_HETU);
    await this.pages.adminLandingpage.checksTheAdminLandingPageH1(
      V.ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO
    );
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
    // Set Up … And Open Url waits for the page to load
    await this.pages.devices.setUpChromiumDesktopBrowserAndOpenUrl(V.URL_DJANGO_ADMIN, V.DOWNLOAD_DIR);
    // Check Text  h1  Ylläpito
    // h1 on Ylläpito
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN}
  }

  @step("app_common.Admin Navigates To Django Admin")
  async adminNavigatesToDjangoAdmin() {
    // Default is chrome
    // Go To waits for the page to load
    await this.page.goto(V.URL_DJANGO_ADMIN);

    // END OF ADMIN TEST SET UP
  }

  // SWITCH PAGE
  @step("app_common.Switch To New Tab From Current Page")
  async switchToNewTabFromCurrentPage() {
    let page1: RobotValue;
    page1 = this.page;
    V.PAGE1 = page1;
    page1 = V.PAGE1;
    await log(page1.url());
    await this.session.switchTo(this.session.latestPage());
    await this.page.waitForLoadState("load", { timeout: 15_000 });
  }

  @step("app_common.Open New Window From Admin Side To User Side And Saves Both Windows")
  async openNewWindowFromAdminSideToUserSideAndSavesBothWindows(url: string) {
    let admin_page: Page, user_page: Page;
    // Save the current page
    admin_page = this.page;
    V.PAGE_ADMIN_SIDE = admin_page;
    await log(`Admin page is ${admin_page.url()}`);

    // Open the user side page in a brand new tab
    user_page = await this.session.newPage();
    // Go To waits for the page to load
    await user_page.goto(url);
    // Finish loading the user side first, switching back too early logged the admin out
    await this.reloadPageAndWaitForBannerNotifications();

    // Save the new page
    V.PAGE_USER_SIDE = user_page;
    await log(`User page is ${user_page.url()}`);
  }

  /** Sets up two separate browsers: Firefox for Django admin and Chromium for app admin */
  @step("app_common.Open Django Admin In Firefox And App Admin In Chromium")
  async openDjangoAdminInFirefoxAndAppAdminInChromium(django_url: string, app_url: string) {
    // Set up Firefox browser for Django admin
    await log("🦊 Setting up Firefox browser for Django admin...");
    await this.pages.devices.setUpFirefoxDesktopBrowserAndOpenUrl(django_url, V.DOWNLOAD_DIR);

    // Save the Firefox page
    V.BROWSER_ADMIN_SIDE = this.page;
    await log(`Django admin (Firefox) page is ${this.page.url()}`);

    // Set up Chromium browser for app admin
    await log("🌐 Setting up Chromium browser for app admin...");
    await this.pages.devices.setUpChromiumDesktopBrowserAndOpenUrl(app_url, V.DOWNLOAD_DIR);

    // Save the Chromium page
    V.BROWSER_USER_SIDE = this.page;
    await log(`App admin (Chromium) page is ${this.page.url()}`);

    await log("✅ Both browsers set up successfully");
  }

  @step("app_common.Reload Page")
  async reloadPage() {
    await this.page.reload();
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
    expect(response.ok(), `Banner query failed: HTTP ${response.status()}`).toBe(true);
    expect(await graphqlErrorsIn(response, 20_000), "Banner query returned errors").toBe(false);

    // END OF SWITCH PAGE
  }
}
