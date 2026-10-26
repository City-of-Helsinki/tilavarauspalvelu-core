/** Port of PO/Admin/django_admin.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const django_admin = keywords("django_admin", {
  "Admin Changes Permissions": async (role_value: RobotValue) => {
    await Browser["Click"]("id=id_role");
    // Wait for the dropdown to open
    await BuiltIn["Sleep"]("1s");
    await Browser["Select Options By"]("id=id_role", "value", role_value);
    await BuiltIn["Sleep"]("1s");
  },

  "Admin Checks Permission Is Not Present": async (role_value: RobotValue) => {
    let option_count: RobotValue;
    await Browser["Click"]("id=id_role");
    // Wait for the dropdown to open
    await BuiltIn["Sleep"]("1s");
    option_count = await Browser["Get Element Count"](`id=id_role >> option[value="${str(role_value)}"]`);
    await BuiltIn["Should Be Equal As Numbers"](
      option_count,
      "0",
      named({ msg: `Option with value "${str(role_value)}" should not be present` })
    );
  },

  "Admin Saves Changes": async () => {
    await Browser["Click"]('input[value="Tallenna ja poistu"]');
    await BuiltIn["Sleep"]("3s");
  },

  "Admin Searches The User By Email": async (user_email: RobotValue) => {
    await Browser["Type Text"]("id=searchbar", user_email);
    await BuiltIn["Sleep"]("1s");
    await Browser["Click"]('input[type="submit"]');
    await BuiltIn["Sleep"]("4s"); // wait for the search results to load
  },

  /** Clicks the role link in the search results. Should be used after searching by email to ensure only one match exists. */
  "Admin Clicks First User": async () => {
    await Browser["Click"](".field-role a");
    await BuiltIn["Sleep"]("4s"); // wait for the page to load
  },

  "Admin Navigates To General Role Page": async () => {
    await Browser["Go To"]("https://varaamo.test.hel.ninja/admin/tilavarauspalvelu/generalrole/");
    await BuiltIn["Sleep"]("4s"); // wait for the page to load
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },

  "Admin Navigates To Unit Role Page": async () => {
    await Browser["Go To"]("https://varaamo.test.hel.ninja/admin/tilavarauspalvelu/unitrole/");
    await BuiltIn["Sleep"]("4s"); // wait for the page to load
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },
});
