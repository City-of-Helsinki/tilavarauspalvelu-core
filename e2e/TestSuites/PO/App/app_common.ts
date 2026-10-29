/** Port of PO/App/app_common.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { Collections } from "../../../lib/Collections";
import { V, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { admin_landingpage } from "../../PO/Admin/admin_landingpage";
import { login } from "../../PO/Common/login";
import { popups } from "../../PO/Common/popups";
import { topnav } from "../../PO/Common/topnav";
import { user_landingpage } from "../../PO/User/user_landingpage";
import { custom_keywords } from "../../Resources/custom_keywords";
import { devices } from "../../Resources/devices";
import "../../Resources/variables";
import "../../Resources/serial_users";
import "../../Resources/texts_FI";
import "../../Resources/create_data";
import "../../Resources/parallel_test_data";

export const app_common = keywords("app_common", {
  // USER TEST SET UP
  // Desktop - iPhone - Android
  // LANGUAGE FI
  "User Opens Desktop Browser To Django Admin": async () => {
    // Default is chrome
    await devices["Set Up Chromium Desktop Browser And Open Url"](V.URL_DJANGO_ADMIN, V.DOWNLOAD_DIR);
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
    // Check Text  h1  Ylläpito
    // h1 on Ylläpito
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN}
  },

  "User Opens Desktop Browser To Landing Page": async () => {
    // Default is chrome

    await devices["Set Up Chromium Desktop Browser And Open Url"](V.URL_TEST, V.DOWNLOAD_DIR);
    await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
  },

  "User Opens Iphone Webkit To Landing Page": async () => {
    await devices["Set Up Iphone 14 And Open Url"](V.URL_TEST);
    await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
  },

  "User Opens Android Chrome To Landing Page": async () => {
    await devices["Set Up Android Pixel 5 And Open Url"](V.URL_TEST);
    await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
  },

  "User Opens Desktop Browser To Mail": async () => {
    // Default is firefox
    await devices["Set Up Firefox Desktop Browser And Open Url"](V.URL_MAIL, V.DOWNLOAD_DIR);

    // END OF USER TEST SET UP
  },

  // USER
  "User Logs In With Suomi Fi": async () => {
    await topnav["Click Login"]();
    await login["Login Suomi Fi"](V.CURRENT_USER_HETU);
    // Confirms we are on the landing page
    await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
    await popups["User Accepts Cookies If Dialog Is Visible"](V.COOKIETEXT);
    await devices["Log Current Cookies"]();
  },

  /** This information comes from tunnistamo and is not always available */
  "User Checks Dropdown Menu Has User Info (NOT IN USE)": async () => {
    await topnav["Check Dropdown Menu Has User Info"](V.BASIC_USER_MALE_FULLNAME);
  },

  "User Goes To Landing Page": async () => {
    await Browser["Go To"](V.URL_TEST);
  },

  "User Logs Out": async () => {
    await topnav["Click User Menu"]();
    await topnav["Click Logout"]();
  },

  "User Confirms Log Out": async () => {
    await topnav["Click Login"]();

    // Confirms the logout was success
    await Browser["Wait For Elements State"]("id=social-suomi_fi", "visible");
  },

  "Verify Notification Banner Message": async (notification_banner_message: string, notification_type: string) => {
    await Browser["Wait For Elements State"](`section${notification_type}`, "visible", named({ timeout: "10s" }));

    await custom_keywords["Check Elements Text"](`section${notification_type}`, notification_banner_message);
  },

  /** Fails if a notification banner is shown. Use after the banners have loaded. */
  "Verify Notification Banner Message Is Not Visible": async () => {
    let banner_count: RobotValue;
    // Port: kept on purpose. The banners' query has returned, and when no banner should show there is nothing to
    // wait for, so a banner that renders a moment late gets a second before the count.
    await BuiltIn["Sleep"]("1s");
    banner_count = await Browser["Get Element Count"]('[data-testid="BannerNotificationList__Notification"]');
    await BuiltIn["Should Be Equal As Integers"](
      banner_count,
      "0",
      named({ msg: "A notification banner is visible but should not be" })
    );
  },

  // Mobile
  "User Logs Out Mobile": async () => {
    await topnav["Click Navigation Menu Mobile"]();
    await topnav["Click User Menu Mobile"]();
    await topnav["Click Logout Mobile"]();
  },

  "User Confirms Log Out Mobile": async () => {
    await topnav["Click Navigation Menu Mobile"]();
    await topnav["Click Login Mobile"]();

    // Confirms the logout was success
    await Browser["Wait For Elements State"]("id=social-suomi_fi", "visible");
  },

  "User Logs In With Suomi Fi Mobile": async () => {
    await topnav["Click Navigation Menu Mobile"]();
    await topnav["Click Login Mobile"]();
    // login.Login Suomi_fi mobile  ${BASIC_USER_MALE_HETU}
    await login["Login Suomi Fi Mobile"](V.CURRENT_USER_HETU);

    // Confirms the login was success
    await user_landingpage["Check The User Landing Page H1"](V.USER_LANDING_PAGE_H1_TEXT);
    await popups["User Accepts Cookies If Dialog Is Visible"](V.COOKIETEXT);

    // Sleep  3s
    // TODO enable these steps when the dropdown has user info again
    // topnav.Check dropdown menu has user info  ${BASIC_USER_MALE_FULLNAME}

    // END OF USER
  },

  // ADMIN TEST SET UP
  // Desktop for now.
  // LANGUAGE FI
  "Admin Opens Desktop Browser To Landing Page": async () => {
    // Default is chrome
    // create_data.Create robot test data
    await devices["Set Up Chromium Desktop Browser And Open Url"](V.URL_ADMIN, V.DOWNLOAD_DIR);
    await admin_landingpage["Checks The Admin Landing Page H1"](V.ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  },

  "Admin Goes To Landing Page": async () => {
    // Go To waits for the page to load
    await Browser["Go To"](V.URL_ADMIN);
    await admin_landingpage["Checks The Admin Landing Page H1"](V.ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN);
  },

  "Admin Logs In With Suomi Fi": async () => {
    await topnav["Click Login Admin Side"]();
    await login["Login Suomi Fi"](V.ADMIN_CURRENT_USER_HETU);
    await admin_landingpage["Checks The Admin Landing Page H1"](V.ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO);
    // Wait For Elements State  id=user-menu  visible
    // TODO enable these steps when the dropdown has user info again
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN}
    // Sleep  3s
    // topnav.Check dropdown menu has user info  ${BASIC_ADMIN_MALE_FULLNAME}
  },

  /**
   * Logs in the permission target admin (Marika Salminen) for permission tests
   * This is the admin whose permissions are being modified and verified
   */
  "Permission Target Admin Logs In With Suomi Fi": async () => {
    await topnav["Click Login Admin Side"]();
    await login["Login Suomi Fi"](V.PERMISSION_TARGET_ADMIN_HETU);
    await admin_landingpage["Checks The Admin Landing Page H1"](V.ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO);
    // Wait For Elements State  id=user-menu  visible
    // TODO enable these steps when the dropdown has user info again
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN}
    // Sleep  3s
    // topnav.Check dropdown menu has user info  ${BASIC_ADMIN_MALE_FULLNAME}
  },

  "Admin Logs Out": async () => {
    await topnav["Click User Menu"]();
    await topnav["Click Logout Admin Side"]();
    // TODO enable these steps when the dropdown has user info again
    // custom_keywords.Check text of element with logging  p  ${USER_LOGOUT_TEXT}
  },

  "Admin Opens Desktop Browser To Django Admin": async () => {
    // Default is chrome
    await devices["Set Up Chromium Desktop Browser And Open Url"](V.URL_DJANGO_ADMIN, V.DOWNLOAD_DIR);
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
    // Check Text  h1  Ylläpito
    // h1 on Ylläpito
    // admin_landingpage.Checks the admin landing page H1  ${ADMIN_LANDING_PAGE_H1_TEXT_NOT_LOGGED_IN}
  },

  "Admin Navigates To Django Admin": async () => {
    // Default is chrome
    // Go To waits for the page to load
    await Browser["Go To"](V.URL_DJANGO_ADMIN);

    // END OF ADMIN TEST SET UP
  },

  // SWITCH PAGE
  "Switch To New Tab From Current Page": async () => {
    let page1: RobotValue;
    page1 = await Browser["Get Page Ids"]("ACTIVE", "ACTIVE", "ACTIVE");
    V.PAGE1 = page1;
    page1 = V.PAGE1;
    await BuiltIn["Log"](page1);
    await Browser["Switch Page"]("NEW");
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },

  "Open New Window From Admin Side To User Side And Saves Both Windows": async (url: string) => {
    let all_pages_before: RobotValue, admin_id: RobotValue, user_handle: RobotValue;
    // Save the current page
    all_pages_before = await Browser["Get Page Ids"]();
    admin_id = await Collections["Get From List"](all_pages_before, "0");
    V.PAGE_ADMIN_SIDE = admin_id;
    await BuiltIn["Log"](`Admin page handle is ${str(V.PAGE_ADMIN_SIDE)}`);

    // Open the user side page in a brand new tab
    user_handle = await Browser["New Page"](url);
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
    // Finish loading the user side first, switching back too early logged the admin out
    await app_common["Reload Page And Wait For Banner Notifications"]();

    // Save the new page
    V.PAGE_USER_SIDE = user_handle;
    await BuiltIn["Log"](`User page handle is ${str(V.PAGE_USER_SIDE)}`);
  },

  /** Sets up two separate browsers: Firefox for Django admin and Chromium for app admin */
  "Open Django Admin In Firefox And App Admin In Chromium": async (django_url: string, app_url: string) => {
    let firefox_browsers: RobotValue,
      firefox_browser_id: RobotValue,
      chromium_browsers: RobotValue,
      chromium_browser_id: RobotValue;
    // Set up Firefox browser for Django admin
    await BuiltIn["Log"]("🦊 Setting up Firefox browser for Django admin...");
    await devices["Set Up Firefox Desktop Browser And Open Url"](django_url, V.DOWNLOAD_DIR);

    // Get and save the Firefox browser ID
    firefox_browsers = await Browser["Get Browser Ids"]("ACTIVE");
    firefox_browser_id = await Collections["Get From List"](firefox_browsers, "0");
    V.BROWSER_ADMIN_SIDE = firefox_browser_id;
    await BuiltIn["Log"](`Django admin (Firefox) browser ID is ${str(V.BROWSER_ADMIN_SIDE)}`);

    // Set up Chromium browser for app admin
    await BuiltIn["Log"]("🌐 Setting up Chromium browser for app admin...");
    await devices["Set Up Chromium Desktop Browser And Open Url"](app_url, V.DOWNLOAD_DIR);

    // Get and save the Chromium browser ID
    chromium_browsers = await Browser["Get Browser Ids"]("ACTIVE");
    chromium_browser_id = await Collections["Get From List"](chromium_browsers, "0");
    V.BROWSER_USER_SIDE = chromium_browser_id;
    await BuiltIn["Log"](`App admin (Chromium) browser ID is ${str(V.BROWSER_USER_SIDE)}`);

    await BuiltIn["Log"]("✅ Both browsers set up successfully");
  },

  "Reload Page": async () => {
    await Browser["Reload"]();
    await Browser["Wait For Load State"]("networkidle", named({ timeout: "30s" }));
  },

  /**
   * Reloads and waits until banners are loaded, so "not visible" checks can be trusted.
   * Waits for ShowNotificationsList (customer side) or BannerNotificationsList (admin notifications list page).
   */
  "Reload Page And Wait For Banner Notifications": async () => {
    let reload_started: RobotValue, banners_loaded: RobotValue, response: RobotValue;
    // Only requests started after the reload count, the previous page's request must not end the wait
    reload_started = Date.now();
    banners_loaded = await Browser["Promise To"](
      Browser["Wait For Response"],
      named({
        matcher: (response: RobotValue) =>
          response.request().timing().startTime >= reload_started &&
          response.url().includes("/graphql") &&
          /ShowNotificationsList|BannerNotificationsList/.test(response.request().postData() || ""),
        timeout: "20s",
      })
    );
    await Browser["Reload"]();
    response = await Browser["Wait For"](banners_loaded);
    // A failed query shows no banners, which would let "not visible" checks pass for the wrong reason
    await BuiltIn["Should Be True"](
      response.ok,
      named({ msg: `Banner query failed: HTTP ${str(response["status"])}` })
    );
    await BuiltIn["Should Be True"](
      !Object.hasOwn(response.body || {}, "errors"),
      named({ msg: "Banner query returned errors" })
    );

    // END OF SWITCH PAGE
  },
});
