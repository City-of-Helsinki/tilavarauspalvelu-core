/** Port of PO/Admin/admin_navigation_menu.robot */
import { step } from "../../../lib/robot";
import { PageObject } from "../../page-object";

export class AdminNavigationMenu extends PageObject {
  @step("admin_navigation_menu.Admin Navigates To Requested Reservations")
  async adminNavigatesToRequestedReservations() {
    await this.page.locator('[href="/kasittely/reservations/requested"]').click();
    await this.page.waitForURL((url) => url.pathname === "/kasittely/reservations/requested");
  }

  @step("admin_navigation_menu.Admin Navigates To Reservations")
  async adminNavigatesToReservations() {
    await this.page.locator('[href="/kasittely/reservations"]').click();
    await this.page.waitForURL((url) => url.pathname === "/kasittely/reservations");
  }

  @step("admin_navigation_menu.Admin Navigates To Application Rounds")
  async adminNavigatesToApplicationRounds() {
    await this.page.locator('[href="/kasittely/application-rounds"]').click();
    await this.page.waitForURL((url) => url.pathname === "/kasittely/application-rounds");
  }

  @step("admin_navigation_menu.Admin Navigates To Reservation Units")
  async adminNavigatesToReservationUnits() {
    await this.page.locator('[href="/kasittely/reservation-units"]').click();
    await this.page.waitForURL((url) => url.pathname === "/kasittely/reservation-units");
  }

  @step("admin_navigation_menu.Admin Navigates To Units")
  async adminNavigatesToUnits() {
    await this.page.locator('[href="/kasittely/units"]').click();
    await this.page.waitForURL((url) => url.pathname === "/kasittely/units");
  }

  @step("admin_navigation_menu.Admin Navigates To My Units")
  async adminNavigatesToMyUnits() {
    await this.page.locator('[href="/kasittely/my-units"]').click();
    await this.page.waitForURL((url) => url.pathname === "/kasittely/my-units");
  }

  @step("admin_navigation_menu.Admin Navigates To Notifications")
  async adminNavigatesToNotifications() {
    await this.page.locator('[href="/kasittely/notifications"]').click();
    // The create link is only on the notifications list page
    await this.page.locator('[href="/kasittely/notifications/new"]').waitFor({ state: "visible", timeout: 15_000 });
  }
}
