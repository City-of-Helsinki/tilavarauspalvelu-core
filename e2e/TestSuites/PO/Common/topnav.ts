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

/** The button that opens the phone's Menu, and says in `aria-expanded` whether it is open */
const MOBILE_MENU_BUTTON = '[aria-controls="hds-mobile-menu"]';

/**
 * Closes the HDS mobile menu after one of its links has opened a page. The page opens without a reload, so the menu
 * stays open, and an open menu swallows the next click outside it. Escape closes the menu only if it is open.
 */
async function closeMobileMenu(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(page.locator(MOBILE_MENU_BUTTON), "The mobile menu is closed").toHaveAttribute("aria-expanded", "false");
}

export class Topnav extends PageObject {
  /** The page header */
  private get header() {
    return this.page.locator("header");
  }

  /** On a phone, the header's login, user menu and links are in its Menu: opens it, unless it is open already. */
  private async openMenuOnPhone() {
    if (!this.isMobile) {
      return;
    }
    // The Menu button is a toggle, so a click on an open Menu would close it
    if ((await this.page.locator(MOBILE_MENU_BUTTON).getAttribute("aria-expanded")) !== "true") {
      await this.clickNavigationMenuMobile();
    }
  }

  /** On a phone, closes the Menu that a link in it left open. */
  private async closeMenuOnPhone() {
    if (this.isMobile) {
      await closeMobileMenu(this.page);
    }
  }

  @step("topnav.Click Login")
  async clickLogin() {
    await this.openMenuOnPhone();
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
    await this.openMenuOnPhone();
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
    await this.openMenuOnPhone();
    await this.pages.customKeywords.clickAndWaitForPage(
      this.header.getByRole("link", { name: SINGLEBOOKING_FI, exact: true }),
      "/search"
    );
    await this.closeMenuOnPhone();
  }

  @step("topnav.Navigate To My Bookings")
  async navigateToMyBookings() {
    await this.openMenuOnPhone();
    await this.header.getByRole("link", { name: MYBOOKINGS_FI, exact: true }).click();

    // Confirms page is loaded
    await this.pages.mybookings.checkMyBookingsH1(MYBOOKINGS_FI);
    await this.pages.mybookings.waitForUpcomingBookingsToLoad();
    await this.closeMenuOnPhone();
  }

  @step("topnav.Navigate To Recurring Booking Page")
  async navigateToRecurringBookingPage() {
    await this.openMenuOnPhone();
    await this.header.getByRole("link", { name: RECURRING_BOOKINGS_FI, exact: true }).click();
    await this.page.waitForURL((url) => url.pathname === "/recurring");
    await this.closeMenuOnPhone();
  }

  @step("topnav.Navigate To My Applications")
  async navigateToMyApplications() {
    await this.openMenuOnPhone();
    await this.header.getByRole("link", { name: MYAPPLICATIONS_FI, exact: true }).click();
    await this.page.waitForURL((url) => url.pathname === "/applications");
    await this.closeMenuOnPhone();
  }

  // MOBILE UI
  @step("topnav.Click Navigation Menu Mobile")
  async clickNavigationMenuMobile() {
    // The clicks in the menu wait until its animation has ended
    await this.page.locator("#Menu").click();
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
}
