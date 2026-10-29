/** Desktop browser tests for Admin functionality */
import { log } from "../lib/runtime";
import { test } from "./fixtures";
import {
  ADMIN_ROLE_ADMIN,
  ADMIN_ROLE_HANDLER,
  ADMIN_ROLE_NOTIFICATION_MANAGER,
  ADMIN_ROLE_RESERVER,
  ADMIN_ROLE_VIEWER,
  UNIT_LOCATION,
  URL_ADMIN,
  URL_DJANGO_ADMIN,
} from "./Resources/variables";

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
      async ({ appAdmin, appCommon, commonSetupsTeardowns, testData }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.adminLogsInWithSuomiFi();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(UNIT_LOCATION);
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(testData.units.unavailableUnit);

        await appAdmin.adminMakesReservationForBehalfAndClicksSubmit();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(testData.units.unavailableUnit);
        await appAdmin.adminAttemptsToMakeAnUnavailableReservationAndClicksCancel();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(testData.units.unavailableUnit);
        await appAdmin.adminMakesReservationForClosedAndClicksSubmit();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(testData.units.unavailableUnit);
        await appAdmin.adminAttemptsToMakeAnUnavailableReservationAndClicksCancel();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(testData.units.unavailableUnit);
        await appAdmin.adminMakesReservationForStaffAndClicksSubmit();
        await appAdmin.adminOpensMakeReservationModalAndSelectsUnit(testData.units.unavailableUnit);
        await appAdmin.adminAttemptsToMakeAnUnavailableReservationAndClicksCancel();
      }
    );

    test(
      "Admin checks permissions",
      { tag: ["@admin-test-data-set-2", "@admin-suite", "@general-permissions-test"] },
      async ({
        adminReservations,
        appAdmin,
        appCommon,
        commonSetupsTeardowns,
        djangoAdmin,
        login,
        session,
        state,
        testData,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.openDjangoAdminInFirefoxAndAppAdminInChromium(URL_DJANGO_ADMIN, URL_ADMIN);
        // Now in Chromium, so switch to Firefox for Django admin operations
        await session.switchTo(state.browserAdminSide);

        await login.loginDjangoAdmin(testData.djangoAdmin.djangoUsername);

        await log("Django admin changes permissions for admin user to notification manager");
        await djangoAdmin.adminNavigatesToGeneralRolePage();
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_NOTIFICATION_MANAGER);
        await djangoAdmin.adminSavesChanges();

        // Switch to Chromium browser for app admin checks
        await session.switchTo(state.browserUserSide);
        await log("Checking permissions");
        await appCommon.permissionTargetAdminLogsInWithSuomiFi();
        await appAdmin.adminChecksTopNavigationForNotificationManager();

        await session.switchTo(state.browserAdminSide);

        await log("Django admin changes permissions to viewer");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_VIEWER);
        await djangoAdmin.adminSavesChanges();
        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForViewer();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(UNIT_LOCATION);
        await appAdmin.adminChecksThatReservationCannotBeMade();

        await session.switchTo(state.browserAdminSide);

        await log("Django admin changes permissions to reserver");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_RESERVER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForReserver();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(state.browserAdminSide);
        await log("Django admin changes permissions to handler");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_HANDLER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForHandler();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(state.browserAdminSide);
        await log("Django admin changes permissions to admin");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_ADMIN);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
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
      async ({
        adminReservations,
        appAdmin,
        appCommon,
        commonSetupsTeardowns,
        djangoAdmin,
        login,
        session,
        state,
        testData,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.openDjangoAdminInFirefoxAndAppAdminInChromium(URL_DJANGO_ADMIN, URL_ADMIN);

        // Now in Chromium, so switch to Firefox for Django admin operations
        await session.switchTo(state.browserAdminSide);

        await login.loginDjangoAdmin(testData.djangoAdmin.djangoUsername);

        await log("Django admin checks that notification manager permission is not present");
        await djangoAdmin.adminNavigatesToUnitRolePage();
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChecksPermissionIsNotPresent(ADMIN_ROLE_NOTIFICATION_MANAGER);

        await log("Django admin changes permissions to viewer");
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_VIEWER);
        await djangoAdmin.adminSavesChanges();
        // Switch to Chromium browser for app admin checks
        await session.switchTo(state.browserUserSide);

        await log("Checking permissions for viewer");
        await appCommon.permissionTargetAdminLogsInWithSuomiFi();
        await appAdmin.adminChecksTopNavigationForViewerWithUnitPermissions();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(UNIT_LOCATION);
        await appAdmin.adminChecksThatReservationCannotBeMade();

        await session.switchTo(state.browserAdminSide);

        await log("Django admin changes permissions to reserver");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_RESERVER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForReserverWithUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(state.browserAdminSide);
        await log("Django admin changes permissions to handler");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_HANDLER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForHandlerWithUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(state.browserAdminSide);
        await log("Django admin changes permissions to admin");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_ADMIN);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
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
      async ({
        adminReservations,
        appAdmin,
        appCommon,
        commonSetupsTeardowns,
        djangoAdmin,
        login,
        session,
        state,
        testData,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();
        await appCommon.openDjangoAdminInFirefoxAndAppAdminInChromium(URL_DJANGO_ADMIN, URL_ADMIN);

        // Now in Chromium, so switch to Firefox for Django admin operations
        await session.switchTo(state.browserAdminSide);

        await login.loginDjangoAdmin(testData.djangoAdmin.djangoUsername);

        await log("Django admin checks that notification manager permission is not present");
        await djangoAdmin.adminNavigatesToUnitRolePage();
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChecksPermissionIsNotPresent(ADMIN_ROLE_NOTIFICATION_MANAGER);

        // Switch to Chromium browser for app admin checks
        await log("Django admin changes permissions to viewer");
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_VIEWER);
        await djangoAdmin.adminSavesChanges();
        // Switch to Chromium browser for app admin checks
        await session.switchTo(state.browserUserSide);

        await log("Checking permissions for viewer");
        await appCommon.permissionTargetAdminLogsInWithSuomiFi();
        await appAdmin.adminChecksTopNavigationForViewerWithGroupUnitPermissions();
        await appAdmin.adminNavigatesToOwnUnitsAndSelectsUnitGroup(UNIT_LOCATION);
        await appAdmin.adminChecksThatReservationCannotBeMade();

        await session.switchTo(state.browserAdminSide);

        await log("Django admin changes permissions to reserver");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_RESERVER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForReserverWithGroupUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(state.browserAdminSide);
        await log("Django admin changes permissions to handler");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_HANDLER);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForHandlerWithGroupUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();

        await session.switchTo(state.browserAdminSide);
        await log("Django admin changes permissions to admin");
        await djangoAdmin.adminSearchesTheUserByEmail(testData.permissionTarget.email);
        await djangoAdmin.adminClicksFirstUser();
        await djangoAdmin.adminChangesPermissions(ADMIN_ROLE_ADMIN);
        await djangoAdmin.adminSavesChanges();

        await session.switchTo(state.browserUserSide);
        await appCommon.reloadPage();
        await log("Checking permissions");
        await appAdmin.adminChecksTopNavigationForAdminWithGroupUnitPermissions();
        await appAdmin.adminClicksMakeReservationAndChecksDialogOpens();
        await adminReservations.adminClosesDialogModal();
      }
    );
  }
);
