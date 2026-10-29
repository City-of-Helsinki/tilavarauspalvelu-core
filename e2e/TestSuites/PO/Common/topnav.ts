/** A resource file with top navigation keywords. */
import { Browser, currentPage, loc } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, expect, keywords, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { mybookings } from "../../PO/User/mybookings";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

/**
 * Clicks a logout button and waits until the logout is done: signOut (packages/ui) ends on the app's /auth/logout/,
 * which redirects back to the app after the session is destroyed.
 */
async function clickAndWaitForLogout(logout_button: string): Promise<void> {
  const page = currentPage();
  const app_host = new URL(page.url()).host;
  // Waiting together, so a failed click doesn't leave the response wait unhandled
  await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname.endsWith("/auth/logout/"), {
      timeout: 30_000,
    }),
    Browser["Click"](logout_button),
  ]);
  await page.waitForURL((url) => url.host === app_host && !url.pathname.endsWith("/auth/logout/"));
}

export const topnav = keywords("topnav", {
  "Click Login": async () => {
    await Browser["Click"]("id=login");
  },

  "Click Login Admin Side": async () => {
    await Browser["Wait For Elements State"]("h1", "visible");
    await Browser["Click"](`button >> span:text-is("${str(V.LOGIN_TEXT_ADMIN)}") >> nth=-1`);
  },

  "Click Logout": async () => {
    await clickAndWaitForLogout('css=[aria-label="Kirjaudu ulos"]');
  },

  "Click Logout Admin Side": async () => {
    await clickAndWaitForLogout('css=[aria-label="signout"]');
  },

  "Click User Menu": async () => {
    await Browser["Click"]("id=user-menu");
  },

  "Click Close Navigation Menu": async () => {
    await Browser["Click"]("id=Menu");
  },

  "Check Dropdown Menu Has User Info": async (name: RobotValue) => {
    // DEVNOTE Enable this when the profile bug no longer empties the name info
    await BuiltIn["Log"](name);
    await expect(loc("id=user-menu")).toHaveText(str(name), { useInnerText: true });
  },

  "Navigate To Single Booking Page": async () => {
    await custom_keywords["Click And Wait For Page"](
      `header >> [href="/search"]:text-is("${str(V.SINGLEBOOKING_FI)}")`,
      "/search"
    );
  },

  "Navigate To My Bookings": async () => {
    await Browser["Click"](`header >> [href="/reservations"]:text-is("${str(V.MYBOOKINGS_FI)}")`);

    // Confirms page is loaded
    await mybookings["Check My Bookings H1"](V.MYBOOKINGS_FI);
    await mybookings["Wait For Upcoming Bookings To Load"]();
  },

  "Navigate To Recurring Booking Page": async () => {
    await Browser["Click"](`header >> [href="/recurring"]:text-is("${str(V.RECURRING_BOOKINGS_FI)}")`);
    await currentPage().waitForURL((url) => url.pathname === "/recurring");
  },

  "Navigate To My Applications": async () => {
    await Browser["Click"](`header >> [href="/applications"]:text-is("${str(V.MYAPPLICATIONS_FI)}")`);
    await currentPage().waitForURL((url) => url.pathname === "/applications");
  },

  // MOBILE UI
  "Click Navigation Menu Mobile": async () => {
    // The clicks in the menu wait until its animation has ended
    await Browser["Click"]("id=Menu");
  },

  "Click User Menu Mobile": async () => {
    await Browser["Click"]("id=user-menu");
  },

  "Click Login Mobile": async () => {
    await Browser["Click"]("id=login");
  },

  "Click Logout Mobile": async () => {
    await clickAndWaitForLogout('css=[aria-label="Kirjaudu ulos"]');
  },

  "Click Tablist Scroll Button To Right Mobile": async () => {
    // The next click waits until the tab list has stopped sliding
    await Browser["Click"]('[class*=Tabs-module_scrollButton__] >> [aria-label="angle-right"]');
    // Check menu has user info mobile
    // DEVNOTE - Waiting for fixes for the test environment from another team
    // this step will be enabled when the test environment is fixed

    // TODO - 4 selectors of the same name in the ui. Fix better selector
    // [Arguments]  ${Expected_name}  ${Expected_email}
    // Click navigation menu mobile
    // id="user-menu"
    // ${Topnav_menu_name_elements}=  Browser.Get Elements  id=hds-mobile-menu >> [data-testid="navigation__user-name"]
    // ${Topnav_menu_name_element_text}=  Get Text  ${Topnav_menu_name_elements}[1]
    // Should Be Equal  ${Topnav_menu_name_element_text}  ${Expected_name}
    // ${Topnav_menu_email_element_text}=  Get Text  id=hds-mobile-menu >> [data-testid="navigation-user-email"]
    // ${Topnav_menu_email_elements}=  Browser.Get Elements  id=hds-mobile-menu >> [data-testid="navigation-user-email"]
    // ${Topnav_menu_email_element_text}=  Get Text  ${Topnav_menu_email_elements}[1]
    // Should Be Equal  ${Topnav_menu_email_element_text}  ${Expected_email}
  },

  "Navigate To Single Booking Page Mobile": async () => {
    await Browser["Click"]("id=Menu");
    await custom_keywords["Click And Wait For Page"](
      `header >> [href="/search"]:text-is("${str(V.SINGLEBOOKING_FI)}")`,
      "/search"
    );
  },

  "Navigate To My Bookings Mobile": async () => {
    await topnav["Click Navigation Menu Mobile"]();
    await topnav["Navigate To My Bookings"]();
    await Browser["Wait For Elements State"]("h1", "visible");
  },
});
