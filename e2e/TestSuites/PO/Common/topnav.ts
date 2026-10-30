/** A resource file with top navigation keywords. */
import type { Locator, Page } from "@playwright/test";
import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import {
  LOGIN_TEXT_ADMIN,
  MYAPPLICATIONS_FI,
  MYBOOKINGS_FI,
  RECURRING_BOOKINGS_FI,
  SINGLEBOOKING_FI,
} from "../../Resources/texts_FI";

/**
 * Clicks a logout button and waits until the logout is done: signOut (packages/ui) ends on the app's /auth/logout/,
 * which redirects back to the app after the session is destroyed.
 */
async function clickAndWaitForLogout(page: Page, logout_button: Locator): Promise<void> {
  const app_host = new URL(page.url()).host;
  // Waiting together, so a failed click doesn't leave the response wait unhandled
  await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname.endsWith("/auth/logout/"), {
      timeout: 30_000,
    }),
    logout_button.click(),
  ]);
  await page.waitForURL((url) => url.host === app_host && !url.pathname.endsWith("/auth/logout/"));
}

/**
 * Closes the HDS mobile menu after a link in it has opened a page. The app opens the page without a reload, so the
 * menu stays open, and while it is open HDS swallows the next click outside it to close the menu. Escape closes the
 * menu only if it is open.
 */
async function closeMobileMenu(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(page.locator('[aria-controls="hds-mobile-menu"]'), "The mobile menu did not close").toHaveAttribute(
    "aria-expanded",
    "false"
  );
}

export class Topnav extends PageObject {
  @step("topnav.Click Login")
  async clickLogin() {
    await this.page.locator("#login").click();
  }

  @step("topnav.Click Login Admin Side")
  async clickLoginAdminSide() {
    await this.page.locator("h1").waitFor({ state: "visible" });
    // The landing page's button: the header has a login button of the same name before it
    await this.page.getByRole("button", { name: LOGIN_TEXT_ADMIN, exact: true }).last().click();
  }

  @step("topnav.Click Logout")
  async clickLogout() {
    await clickAndWaitForLogout(this.page, this.page.getByRole("button", { name: "Kirjaudu ulos", exact: true }));
  }

  @step("topnav.Click Logout Admin Side")
  async clickLogoutAdminSide() {
    await clickAndWaitForLogout(this.page, this.page.locator('[aria-label="signout"]'));
  }

  @step("topnav.Click User Menu")
  async clickUserMenu() {
    await this.page.locator("#user-menu").click();
  }

  @step("topnav.Click Close Navigation Menu")
  async clickCloseNavigationMenu() {
    await this.page.locator("#Menu").click();
  }

  @step("topnav.Check Dropdown Menu Has User Info")
  async checkDropdownMenuHasUserInfo(name: string) {
    // DEVNOTE Enable this when the profile bug no longer empties the name info
    await expect(this.page.locator("#user-menu")).toHaveText(name, { useInnerText: true });
  }

  @step("topnav.Navigate To Single Booking Page")
  async navigateToSingleBookingPage() {
    await this.pages.customKeywords.clickAndWaitForPage(
      this.page.locator("header").getByRole("link", { name: SINGLEBOOKING_FI, exact: true }),
      "/search"
    );
  }

  @step("topnav.Navigate To My Bookings")
  async navigateToMyBookings() {
    await this.page.locator("header").getByRole("link", { name: MYBOOKINGS_FI, exact: true }).click();

    // Confirms page is loaded
    await this.pages.mybookings.checkMyBookingsH1(MYBOOKINGS_FI);
    await this.pages.mybookings.waitForUpcomingBookingsToLoad();
  }

  @step("topnav.Navigate To Recurring Booking Page")
  async navigateToRecurringBookingPage() {
    await this.page.locator("header").getByRole("link", { name: RECURRING_BOOKINGS_FI, exact: true }).click();
    await this.page.waitForURL((url) => url.pathname === "/recurring");
  }

  @step("topnav.Navigate To My Applications")
  async navigateToMyApplications() {
    await this.page.locator("header").getByRole("link", { name: MYAPPLICATIONS_FI, exact: true }).click();
    await this.page.waitForURL((url) => url.pathname === "/applications");
  }

  // MOBILE UI
  @step("topnav.Click Navigation Menu Mobile")
  async clickNavigationMenuMobile() {
    // The clicks in the menu wait until its animation has ended
    await this.page.locator("#Menu").click();
  }

  @step("topnav.Click User Menu Mobile")
  async clickUserMenuMobile() {
    await this.page.locator("#user-menu").click();
  }

  @step("topnav.Click Login Mobile")
  async clickLoginMobile() {
    await this.page.locator("#login").click();
  }

  @step("topnav.Click Logout Mobile")
  async clickLogoutMobile() {
    await clickAndWaitForLogout(this.page, this.page.getByRole("button", { name: "Kirjaudu ulos", exact: true }));
  }

  @step("topnav.Click Tablist Scroll Button To Right Mobile")
  async clickTablistScrollButtonToRightMobile() {
    // The next click waits until the tab list has stopped sliding
    await this.page.locator("[class*=Tabs-module_scrollButton__]").locator('[aria-label="angle-right"]').click();
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
  }

  @step("topnav.Navigate To Single Booking Page Mobile")
  async navigateToSingleBookingPageMobile() {
    await this.page.locator("#Menu").click();
    await this.pages.customKeywords.clickAndWaitForPage(
      this.page.locator("header").getByRole("link", { name: SINGLEBOOKING_FI, exact: true }),
      "/search"
    );
    await closeMobileMenu(this.page);
  }

  @step("topnav.Navigate To My Bookings Mobile")
  async navigateToMyBookingsMobile() {
    await this.clickNavigationMenuMobile();
    await this.navigateToMyBookings();
    await this.page.locator("h1").waitFor({ state: "visible" });
    await closeMobileMenu(this.page);
  }
}
