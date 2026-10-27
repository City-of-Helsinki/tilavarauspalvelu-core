/** Port of PO/Admin/django_admin.robot */
import { Browser, currentPage, loc } from "../../../lib/Browser";
import { expect, keywords, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const django_admin = keywords("django_admin", {
  "Admin Changes Permissions": async (role_value: RobotValue) => {
    // Port: Select Options By picks the option of the native select without opening it
    await Browser["Select Options By"]("id=id_role", "value", role_value);
  },

  "Admin Checks Permission Is Not Present": async (role_value: RobotValue) => {
    // The options of the native select are in the page from the start
    await expect(
      loc(`id=id_role >> option[value="${str(role_value)}"]`),
      `Option with value "${str(role_value)}" should not be present`
    ).toHaveCount(0);
  },

  "Admin Saves Changes": async () => {
    await Browser["Click"]('input[value="Tallenna ja poistu"]');
    // Saving returns to the list page once the change is stored
    await currentPage().waitForURL((url) => !url.pathname.endsWith("/change/"));
  },

  "Admin Searches The User By Email": async (user_email: RobotValue) => {
    await Browser["Type Text"]("id=searchbar", user_email);
    await Browser["Click"]('input[type="submit"]');
    // The search results page
    await currentPage().waitForURL((url) => url.searchParams.get("q") === str(user_email));
  },

  /** Clicks the role link in the search results. Should be used after searching by email to ensure only one match exists. */
  "Admin Clicks First User": async () => {
    await Browser["Click"](".field-role a");
    // The role's change page
    await currentPage().waitForURL((url) => url.pathname.endsWith("/change/"));
  },

  "Admin Navigates To General Role Page": async () => {
    // Go To waits for the page to load
    await Browser["Go To"]("https://varaamo.test.hel.ninja/admin/tilavarauspalvelu/generalrole/");
  },

  "Admin Navigates To Unit Role Page": async () => {
    // Go To waits for the page to load
    await Browser["Go To"]("https://varaamo.test.hel.ninja/admin/tilavarauspalvelu/unitrole/");
  },
});
