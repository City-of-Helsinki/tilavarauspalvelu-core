/** Port of PO/Admin/django_admin.robot */
import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";

export class DjangoAdmin extends PageObject {
  @step("django_admin.Admin Changes Permissions")
  async adminChangesPermissions(role_value: string) {
    // Port: Select Options By picks the option of the native select without opening it
    await this.page.locator("#id_role").selectOption({ value: role_value });
  }

  @step("django_admin.Admin Checks Permission Is Not Present")
  async adminChecksPermissionIsNotPresent(role_value: string) {
    // The options of the native select are in the page from the start
    await expect(
      this.page.locator("#id_role").locator(`option[value="${role_value}"]`),
      `Option with value "${role_value}" should not be present`
    ).toHaveCount(0);
  }

  @step("django_admin.Admin Saves Changes")
  async adminSavesChanges() {
    await this.page.getByRole("button", { name: "Tallenna ja poistu", exact: true }).click();
    // Saving returns to the list page once the change is stored
    await this.page.waitForURL((url) => !url.pathname.endsWith("/change/"));
  }

  @step("django_admin.Admin Searches The User By Email")
  async adminSearchesTheUserByEmail(user_email: string) {
    await this.page.locator("#searchbar").fill(user_email);
    await this.page.locator('input[type="submit"]').click();
    // The search results page
    await this.page.waitForURL((url) => url.searchParams.get("q") === user_email);
  }

  /** Clicks the role link in the search results. Should be used after searching by email to ensure only one match exists. */
  @step("django_admin.Admin Clicks First User")
  async adminClicksFirstUser() {
    await this.page.locator(".field-role a").click();
    // The role's change page
    await this.page.waitForURL((url) => url.pathname.endsWith("/change/"));
  }

  @step("django_admin.Admin Navigates To General Role Page")
  async adminNavigatesToGeneralRolePage() {
    // Go To waits for the page to load
    await this.page.goto("/admin/tilavarauspalvelu/generalrole/");
  }

  @step("django_admin.Admin Navigates To Unit Role Page")
  async adminNavigatesToUnitRolePage() {
    // Go To waits for the page to load
    await this.page.goto("/admin/tilavarauspalvelu/unitrole/");
  }
}
