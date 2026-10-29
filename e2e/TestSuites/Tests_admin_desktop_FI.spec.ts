/** Desktop browser tests for Admin functionality */
import { V, log } from "../lib/robot";
import { test } from "./fixtures";
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
    test.beforeEach(async ({ appCommon }) => {
      await appCommon.adminOpensDesktopBrowserToLandingPage();
    });

    test.afterEach(async ({ commonSetupsTeardowns }) => {
      await commonSetupsTeardowns.completeTestTeardown();
    });

    test(
      "Admin logs in with suomi_fi",
      { tag: ["@admin-test-data-set-0", "@admin-suite", "@smoke"] },
      async ({ appCommon, commonSetupsTeardowns }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.adminLogsInWithSuomiFi();
        await appCommon.adminLogsOut();
      }
    );

    test(
      "Admin verifies all reservation types and verifies no unavailable reservations exist",
      { tag: ["@admin-test-data-set-1", "@admin-suite"] },
      async ({ appAdmin, appCommon, commonSetupsTeardowns }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.adminLogsInWithSuomiFi();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(V.UNIT_LOCATION);
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(V.CURRENT_UNAVAILABLE_UNIT);

        await appAdmin.adminMakesReservationForBehalfAndClicksSubmit();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(V.CURRENT_UNAVAILABLE_UNIT);
        await appAdmin.adminAttemptsToMakeAnUnavailableReservationAndClicksCancel();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(V.CURRENT_UNAVAILABLE_UNIT);
        await appAdmin.adminMakesReservationForClosedAndClicksSubmit();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(V.CURRENT_UNAVAILABLE_UNIT);
        await appAdmin.adminAttemptsToMakeAnUnavailableReservationAndClicksCancel();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(V.CURRENT_UNAVAILABLE_UNIT);
        await appAdmin.adminMakesReservationForStaffAndClicksSubmit();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(V.CURRENT_UNAVAILABLE_UNIT);
        await appAdmin.adminAttemptsToMakeAnUnavailableReservationAndClicksCancel();
      }
    );

    test(
      "Admin checks permissions",
      { tag: ["@admin-test-data-set-2", "@admin-suite", "@general-permissions-test"] },
      async ({ adminReservations, appAdmin, appCommon, commonSetupsTeardowns, djangoAdmin, login, session }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.openDjangoAdminInFirefoxAndAppAdminInChromium(V.URL_DJANGO_ADMIN, V.URL_ADMIN);
        // Now in Chromium, so switch to Firefox for Django admin operations
        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await login.loginDjangoAdmin(V.DJANGO_ADMIN_DJANGO_USERNAME);

        await log("Django admin changes permissions for admin user to notification manager");
        await djangoAdmin.adminNavigatesToGeneralRolePage();
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_NOTIFICATION_MANAGER);
        await djangoAdmin.adminSavesChanges();

        // Switch to Chromium browser for app admin checks
        await session.switchTo(V.BROWSER_USER_SIDE);
        await log("Checking permissions");
        await appCommon.permissionTargetAdminLogsInWithSuomiFi();
        await appAdmin.adminChecksTopNavigationForNotificationManager();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await log("Django admin changes permissions to viewer");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_VIEWER);
        await djangoAdmin.adminSavesChanges();
        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForViewer();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(V.UNIT_LOCATION);
        await appAdmin.adminChecksThatReservationCannotBeMade();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await log("Django admin changes permissions to reserver");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_RESERVER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForReserver();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);
        await log("Django admin changes permissions to handler");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_HANDLER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForHandler();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);
        await log("Django admin changes permissions to admin");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_ADMIN);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForAdmin();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();
      }
    );

    test(
      "Admin checks unit permissions",
      { tag: ["@admin-test-data-set-3", "@admin-suite", "@unit-permissions-test"] },
      async ({ adminReservations, appAdmin, appCommon, commonSetupsTeardowns, djangoAdmin, login, session }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.openDjangoAdminInFirefoxAndAppAdminInChromium(V.URL_DJANGO_ADMIN, V.URL_ADMIN);

        // Now in Chromium, so switch to Firefox for Django admin operations
        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await login.loginDjangoAdmin(V.DJANGO_ADMIN_DJANGO_USERNAME);

        await log("Django admin checks that notification manager permission is not present");
        await djangoAdmin.adminNavigatesToUnitRolePage();
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChecksPermissionIsNotPresent(V.ADMIN_ROLE_NOTIFICATION_MANAGER);

        await log("Django admin changes permissions to viewer");
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_VIEWER);
        await djangoAdmin.adminSavesChanges();
        // Switch to Chromium browser for app admin checks
        await session.switchTo(V.BROWSER_USER_SIDE);

        await log("Checking permissions for viewer");
        await appCommon.permissionTargetAdminLogsInWithSuomiFi();
        await appAdmin.adminChecksTopNavigationForViewerWithUnitPermissions();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(V.UNIT_LOCATION);
        await appAdmin.adminChecksThatReservationCannotBeMade();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await log("Django admin changes permissions to reserver");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_RESERVER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForReserverWithUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);
        await log("Django admin changes permissions to handler");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_HANDLER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForHandlerWithUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);
        await log("Django admin changes permissions to admin");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_ADMIN);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForAdminWithUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();
      }
    );

    test(
      "Admin checks group unit permissions",
      { tag: ["@admin-test-data-set-4", "@admin-suite", "@unit-group-permissions-test"] },
      async ({ adminReservations, appAdmin, appCommon, commonSetupsTeardowns, djangoAdmin, login, session }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.openDjangoAdminInFirefoxAndAppAdminInChromium(V.URL_DJANGO_ADMIN, V.URL_ADMIN);

        // Now in Chromium, so switch to Firefox for Django admin operations
        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await login.loginDjangoAdmin(V.DJANGO_ADMIN_DJANGO_USERNAME);

        await log("Django admin checks that notification manager permission is not present");
        await djangoAdmin.adminNavigatesToUnitRolePage();
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChecksPermissionIsNotPresent(V.ADMIN_ROLE_NOTIFICATION_MANAGER);

        // Switch to Chromium browser for app admin checks
        await log("Django admin changes permissions to viewer");
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_VIEWER);
        await djangoAdmin.adminSavesChanges();
        // Switch to Chromium browser for app admin checks
        await session.switchTo(V.BROWSER_USER_SIDE);

        await log("Checking permissions for viewer");
        await appCommon.permissionTargetAdminLogsInWithSuomiFi();
        await appAdmin.adminChecksTopNavigationForViewerWithGroupUnitPermissions();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(V.UNIT_LOCATION);
        await appAdmin.adminChecksThatReservationCannotBeMade();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);

        await log("Django admin changes permissions to reserver");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_RESERVER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForReserverWithGroupUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);
        await log("Django admin changes permissions to handler");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_HANDLER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForHandlerWithGroupUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(V.BROWSER_ADMIN_SIDE);
        await log("Django admin changes permissions to admin");
        await djangoAdmin.adminSearchesTheUserByEmail(V.PERMISSION_TARGET_ADMIN_EMAIL);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(V.ADMIN_ROLE_ADMIN);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(V.BROWSER_USER_SIDE);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForAdminWithGroupUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();
      }
    );
  }
);
