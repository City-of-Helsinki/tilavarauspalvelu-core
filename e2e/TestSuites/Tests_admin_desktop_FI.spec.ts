/** Desktop browser tests for Admin functionality */
import { Browser } from "../lib/Browser";
import { BuiltIn } from "../lib/BuiltIn";
import { V } from "../lib/robot";
import { test } from "./fixtures";
import { admin_reservations } from "./PO/Admin/admin_reservations";
import { django_admin } from "./PO/Admin/django_admin";
import { app_admin } from "./PO/App/app_admin";
import { app_common } from "./PO/App/app_common";
import { login } from "./PO/Common/login";
import { common_setups_teardowns } from "./Resources/common_setups_teardowns";
import "./Resources/variables";
import "./Resources/serial_users";
import "./Resources/texts_FI";
import "./Resources/parallel_test_data";
import "./Resources/devices";
import "./Resources/create_data";
import "./Resources/suite_specific_units";

test.describe(
  "Tests admin desktop FI",
  {
    annotation: [
      { type: "Documentation", description: "Desktop browser tests for Admin functionality" },
      {
        type: "Suite Setup",
        description: "Run Only Once    create_data.Create Robot Test Data (the create_data setup project)",
      },
    ],
  },
  () => {
    test.beforeEach(async () => {
      await app_common["Admin Opens Desktop Browser To Landing Page"]();
    });

    test.afterEach(async () => {
      await common_setups_teardowns["Complete Test Teardown"]();
    });

    test("Admin logs in with suomi_fi", { tag: ["@admin-test-data-set-0", "@admin-suite", "@smoke"] }, async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await app_common["Admin Logs In With Suomi Fi"]();
      await app_common["Admin Logs Out"]();
    });

    test(
      "Admin verifies all reservation types and verifies no unavailable reservations exist",
      { tag: ["@admin-test-data-set-1", "@admin-suite"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["Admin Logs In With Suomi Fi"]();
        await app_admin["Admin Navigates To Own Units And Selects Unit Group"](V.UNIT_LOCATION);
        await app_admin["Admin Opens Make Reservation Modal And Selects Unit"](V.CURRENT_UNAVAILABLE_UNIT);

        await app_admin["Admin Makes Reservation For Behalf And Clicks Submit"]();
        await app_admin["Admin Opens Make Reservation Modal And Selects Unit"](V.CURRENT_UNAVAILABLE_UNIT);
        await app_admin["Admin Attempts To Make An Unavailable Reservation And Clicks Cancel"]();
        await app_admin["Admin Opens Make Reservation Modal And Selects Unit"](V.CURRENT_UNAVAILABLE_UNIT);
        await app_admin["Admin Makes Reservation For Closed And Clicks Submit"]();
        await app_admin["Admin Opens Make Reservation Modal And Selects Unit"](V.CURRENT_UNAVAILABLE_UNIT);
        await app_admin["Admin Attempts To Make An Unavailable Reservation And Clicks Cancel"]();
        await app_admin["Admin Opens Make Reservation Modal And Selects Unit"](V.CURRENT_UNAVAILABLE_UNIT);
        await app_admin["Admin Makes Reservation For Staff And Clicks Submit"]();
        await app_admin["Admin Opens Make Reservation Modal And Selects Unit"](V.CURRENT_UNAVAILABLE_UNIT);
        await app_admin["Admin Attempts To Make An Unavailable Reservation And Clicks Cancel"]();
      }
    );

    test(
      "Admin checks permissions",
      { tag: ["@admin-test-data-set-2", "@admin-suite", "@general-permissions-test"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["Open Django Admin In Firefox And App Admin In Chromium"](V.URL_DJANGO_ADMIN, V.URL_ADMIN);
        // Now in Chromium, so switch to Firefox for Django admin operations
        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await login["Login Django Admin"](V.DJANGO_ADMIN_DJANGO_USERNAME);

        await BuiltIn["Log"]("Django admin changes permissions for admin user to notification manager");
        await django_admin["Admin Navigates To General Role Page"]();
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_NOTIFICATION_MANAGER);
        await django_admin["Admin Saves Changes"]();

        // Switch to Chromium browser for app admin checks
        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await BuiltIn["Log"]("Checking permissions");
        await app_common["Permission Target Admin Logs In With Suomi Fi"]();
        await app_admin["Admin Checks Top Navigation For Notification Manager"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await BuiltIn["Log"]("Django admin changes permissions to viewer");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_VIEWER);
        await django_admin["Admin Saves Changes"]();
        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Viewer"]();
        await app_admin["Admin Navigates To Own Units And Selects Unit Group"](V.UNIT_LOCATION);
        await app_admin["Admin Checks That Reservation Cannot Be Made"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await BuiltIn["Log"]("Django admin changes permissions to reserver");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_RESERVER);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Reserver"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);
        await BuiltIn["Log"]("Django admin changes permissions to handler");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_HANDLER);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Handler"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);
        await BuiltIn["Log"]("Django admin changes permissions to admin");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_ADMIN);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Admin"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();
      }
    );

    test(
      "Admin checks unit permissions",
      { tag: ["@admin-test-data-set-3", "@admin-suite", "@unit-permissions-test"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["Open Django Admin In Firefox And App Admin In Chromium"](V.URL_DJANGO_ADMIN, V.URL_ADMIN);

        // Now in Chromium, so switch to Firefox for Django admin operations
        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await login["Login Django Admin"](V.DJANGO_ADMIN_DJANGO_USERNAME);

        await BuiltIn["Log"]("Django admin checks that notification manager permission is not present");
        await django_admin["Admin Navigates To Unit Role Page"]();
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Checks Permission Is Not Present"](V.ADMIN_ROLE_NOTIFICATION_MANAGER);

        await BuiltIn["Log"]("Django admin changes permissions to viewer");
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_VIEWER);
        await django_admin["Admin Saves Changes"]();
        // Switch to Chromium browser for app admin checks
        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);

        await BuiltIn["Log"]("Checking permissions for viewer");
        await app_common["Permission Target Admin Logs In With Suomi Fi"]();
        await app_admin["Admin Checks Top Navigation For Viewer With Unit Permissions"]();
        await app_admin["Admin Navigates To Own Units And Selects Unit Group"](V.UNIT_LOCATION);
        await app_admin["Admin Checks That Reservation Cannot Be Made"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await BuiltIn["Log"]("Django admin changes permissions to reserver");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_RESERVER);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Reserver With Unit Permissions"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);
        await BuiltIn["Log"]("Django admin changes permissions to handler");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_HANDLER);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Handler With Unit Permissions"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);
        await BuiltIn["Log"]("Django admin changes permissions to admin");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_ADMIN);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Admin With Unit Permissions"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();
      }
    );

    test(
      "Admin checks group unit permissions",
      { tag: ["@admin-test-data-set-4", "@admin-suite", "@unit-group-permissions-test"] },
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();
        await app_common["Open Django Admin In Firefox And App Admin In Chromium"](V.URL_DJANGO_ADMIN, V.URL_ADMIN);

        // Now in Chromium, so switch to Firefox for Django admin operations
        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await login["Login Django Admin"](V.DJANGO_ADMIN_DJANGO_USERNAME);

        await BuiltIn["Log"]("Django admin checks that notification manager permission is not present");
        await django_admin["Admin Navigates To Unit Role Page"]();
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Checks Permission Is Not Present"](V.ADMIN_ROLE_NOTIFICATION_MANAGER);

        // Switch to Chromium browser for app admin checks
        await BuiltIn["Log"]("Django admin changes permissions to viewer");
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_VIEWER);
        await django_admin["Admin Saves Changes"]();
        // Switch to Chromium browser for app admin checks
        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);

        await BuiltIn["Log"]("Checking permissions for viewer");
        await app_common["Permission Target Admin Logs In With Suomi Fi"]();
        await app_admin["Admin Checks Top Navigation For Viewer With Group Unit Permissions"]();
        await app_admin["Admin Navigates To Own Units And Selects Unit Group"](V.UNIT_LOCATION);
        await app_admin["Admin Checks That Reservation Cannot Be Made"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);

        await BuiltIn["Log"]("Django admin changes permissions to reserver");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_RESERVER);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Reserver With Group Unit Permissions"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);
        await BuiltIn["Log"]("Django admin changes permissions to handler");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_HANDLER);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Handler With Group Unit Permissions"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();

        await Browser["Switch Browser"](V.BROWSER_ADMIN_SIDE);
        await BuiltIn["Log"]("Django admin changes permissions to admin");
        await django_admin["Admin Searches The User By Email"](V.PERMISSION_TARGET_ADMIN_EMAIL);
        await django_admin["Admin Clicks First User"]();
        await django_admin["Admin Changes Permissions"](V.ADMIN_ROLE_ADMIN);
        await django_admin["Admin Saves Changes"]();

        await Browser["Switch Browser"](V.BROWSER_USER_SIDE);
        await app_common["Reload Page"]();
        await BuiltIn["Log"]("Checking permissions");
        await app_admin["Admin Checks Top Navigation For Admin With Group Unit Permissions"]();
        await app_admin["Admin Clicks Make Reservation And Checks Dialog Opens"]();
        await admin_reservations["Admin Closes Dialog Modal"]();
      }
    );
  }
);
