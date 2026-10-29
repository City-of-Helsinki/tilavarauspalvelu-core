/** Admin notification tests that must run serially */
import { log } from "../lib/runtime";
import { test } from "./fixtures";
import { NOTIFICATION_BANNER_CLEANUP_PATTERN } from "./Resources/texts_FI";
import {
  NOTIFICATION_TYPE_ERROR,
  NOTIFICATION_TYPE_NORMAL,
  NOTIFICATION_TYPE_WARNING,
  URL_TEST,
} from "./Resources/variables";

test.describe(
  "Tests admin notifications serial",
  {
    tag: ["@combined-test-data-set-0", "@combined-suite", "@serialonly"],
    annotation: [{ type: "Documentation", description: "Admin notification tests that must run serially" }],
  },
  () => {
    test.beforeEach(async ({ appCommon }) => {
      await appCommon.userOpensDesktopBrowserToLandingPage();
    });

    test.afterEach(async ({ commonSetupsTeardowns }) => {
      await commonSetupsTeardowns.completeTestTeardown();
    });

    test("Admin creates normal notifications for both sides", async ({
      adminNavigationMenu,
      adminNotifications,
      adminNotificationsCreatePage,
      appAdmin,
      appCommon,
      commonSetupsTeardowns,
      graphqlCommands,
      popups,
      session,
      state,
    }) => {
      await commonSetupsTeardowns.completeTestSetupFromTags();
      await log("Test cleanup");
      // This is for test cleanup if the last run failed
      await popups.closeNotificationBannerIfVisible();
      await appCommon.adminGoesToLandingPage();
      await appCommon.adminLogsInWithSuomiFi();

      await log("Test cleanup");
      // This is for test cleanup if the last run failed
      await graphqlCommands.draftAllBannerNotifications();
      await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await log("Admin creates normal notification for both sides");
      await adminNavigationMenu.adminNavigatesToNotifications();
      await appAdmin.adminCreatesNormalNotificationForUserAndAdminSide();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies notification banner is created");
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_NORMAL);
      await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_NORMAL);
      await session.switchTo(state.pageAdminSide);
      await log("Admin changes notification target group to only user");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
      await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies notification banner is only visible on user side");
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(state.pageUserSide);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_NORMAL);
      await session.switchTo(state.pageAdminSide);
      await log("Admin changes notification target group to only admin");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
      await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies notification banner is only visible on admin side");
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_NORMAL);
      await session.switchTo(state.pageUserSide);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(state.pageAdminSide);
      await log("Admin deletes notification");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
      await adminNotificationsCreatePage.adminDeletesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
    });

    test("Admin creates warning notifications for both sides", async ({
      adminNavigationMenu,
      adminNotifications,
      adminNotificationsCreatePage,
      appAdmin,
      appCommon,
      commonSetupsTeardowns,
      graphqlCommands,
      popups,
      session,
      state,
    }) => {
      await commonSetupsTeardowns.completeTestSetupFromTags();
      await log("Test cleanup");
      // This is for test cleanup if the last run failed
      await popups.closeNotificationBannerIfVisible();
      await appCommon.adminGoesToLandingPage();
      await appCommon.adminLogsInWithSuomiFi();

      await log("Test cleanup");
      // This is for test cleanup if the last run failed
      await graphqlCommands.draftAllBannerNotifications();
      await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await log("Admin creates warning notification for both sides");
      await adminNavigationMenu.adminNavigatesToNotifications();
      await appAdmin.adminCreatesWarningNotificationForUserAndAdminSide();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies warning notification banner is created");
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_WARNING);
      await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_WARNING);
      await session.switchTo(state.pageAdminSide);
      await log("Admin changes warning notification target group to only user");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameWarning);
      await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies warning notification banner is only visible on user side");
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(state.pageUserSide);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_WARNING);
      await session.switchTo(state.pageAdminSide);
      await log("Admin changes warning notification target group to only admin");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameWarning);
      await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies warning notification banner is only visible on admin side");
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_WARNING);
      await session.switchTo(state.pageUserSide);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(state.pageAdminSide);
      await log("Admin deletes warning notification");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameWarning);
      await adminNotificationsCreatePage.adminDeletesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
    });

    test("Admin creates error notifications for both sides", async ({
      adminNavigationMenu,
      adminNotifications,
      adminNotificationsCreatePage,
      appAdmin,
      appCommon,
      commonSetupsTeardowns,
      graphqlCommands,
      popups,
      session,
      state,
    }) => {
      await commonSetupsTeardowns.completeTestSetupFromTags();
      await log("Test cleanup");
      // This is for test cleanup if the last run failed
      await popups.closeNotificationBannerIfVisible();
      await appCommon.adminGoesToLandingPage();
      await appCommon.adminLogsInWithSuomiFi();

      await log("Test cleanup");
      // This is for test cleanup if the last run failed
      await graphqlCommands.draftAllBannerNotifications();
      await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await log("Admin creates error notification for both sides");
      await adminNavigationMenu.adminNavigatesToNotifications();
      await appAdmin.adminCreatesErrorNotificationForUserAndAdminSide();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies error notification banner is created");
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
      await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
      await session.switchTo(state.pageAdminSide);
      await log("Admin changes error notification target group to only user");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameError);
      await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies error notification banner is only visible on user side");
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(state.pageUserSide);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
      await session.switchTo(state.pageAdminSide);
      await log("Admin changes error notification target group to only admin");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameError);
      await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies error notification banner is only visible on admin side");
      await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
      await session.switchTo(state.pageUserSide);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(state.pageAdminSide);
      await log("Admin deletes error notification");
      await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameError);
      await adminNotificationsCreatePage.adminDeletesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
    });

    test(
      "Admin creates notification and archive and deletes notification for both sides",
      {
        annotation: {
          type: "Documentation",
          description:
            'In this test we don\'t check every step of the notification creation process.\nWe avoid double checking the same parts as in "Admin creates normal notifications for both sides" test.',
        },
      },
      async ({
        adminNavigationMenu,
        adminNotifications,
        adminNotificationsCreatePage,
        appAdmin,
        appCommon,
        commonSetupsTeardowns,
        graphqlCommands,
        popups,
        session,
        state,
      }) => {
        await commonSetupsTeardowns.completeTestSetupFromTags();

        await log("Test cleanup");
        // This is for test cleanup if the last run failed
        await popups.closeNotificationBannerIfVisible();
        await appCommon.adminGoesToLandingPage();
        await appCommon.adminLogsInWithSuomiFi();

        await log("Test cleanup");
        // This is for test cleanup if the last run failed
        await graphqlCommands.draftAllBannerNotifications();
        await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
        await log("Admin creates normal notification");
        await adminNavigationMenu.adminNavigatesToNotifications();
        await appAdmin.adminCreatesNormalNotificationForUserAndAdminSide();

        await log("Admin verifies notification banner is created");
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await log("Admin drafts notification");
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
        await adminNotificationsCreatePage.adminDraftsNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();

        await log("Admin verifies notification banner is drafted and not visible");
        await appCommon.verifyNotificationBannerMessageIsNotVisible();

        await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
        await session.switchTo(state.pageUserSide);
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageAdminSide);

        await log("Admin checks notification is published from drafted state");
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(state.pageAdminSide);

        await log("Admin deletes notification");
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
        await adminNotificationsCreatePage.adminDeletesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await adminNotifications.adminVerifiesNotificationIsNotFound(state.notificationBannerMessageName);
      }
    );
  }
);
