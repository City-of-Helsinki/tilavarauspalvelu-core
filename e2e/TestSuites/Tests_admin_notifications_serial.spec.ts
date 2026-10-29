/** Admin notification tests that must run serially */
import { V, log } from "../lib/robot";
import { test } from "./fixtures";
import "./Resources/variables";
import "./Resources/texts_FI";
import "./Resources/serial_users";
import "./Resources/parallel_test_data";
import "./Resources/devices";
import "./Resources/create_data";
import "./Resources/suite_specific_units";

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
      await graphqlCommands.deleteNotificationsByNamePattern(V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await log("Admin creates normal notification for both sides");
      await adminNavigationMenu.adminNavigatesToNotifications();
      await appAdmin.adminCreatesNormalNotificationForUserAndAdminSide();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies notification banner is created");
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(V.URL_TEST);
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin changes notification target group to only user");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
      await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies notification banner is only visible on user side");
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(V.PAGE_USER_SIDE);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin changes notification target group to only admin");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
      await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies notification banner is only visible on admin side");
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await session.switchTo(V.PAGE_USER_SIDE);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin deletes notification");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
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
      await graphqlCommands.deleteNotificationsByNamePattern(V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await log("Admin creates warning notification for both sides");
      await adminNavigationMenu.adminNavigatesToNotifications();
      await appAdmin.adminCreatesWarningNotificationForUserAndAdminSide();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies warning notification banner is created");
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(V.URL_TEST);
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin changes warning notification target group to only user");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
      await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies warning notification banner is only visible on user side");
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(V.PAGE_USER_SIDE);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin changes warning notification target group to only admin");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
      await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies warning notification banner is only visible on admin side");
      await appCommon.verifyNotificationBannerMessage(
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await session.switchTo(V.PAGE_USER_SIDE);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin deletes warning notification");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
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
      await graphqlCommands.deleteNotificationsByNamePattern(V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await log("Admin creates error notification for both sides");
      await adminNavigationMenu.adminNavigatesToNotifications();
      await appAdmin.adminCreatesErrorNotificationForUserAndAdminSide();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies error notification banner is created");
      await appCommon.verifyNotificationBannerMessage(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI, V.NOTIFICATION_TYPE_ERROR);
      await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(V.URL_TEST);
      await appCommon.verifyNotificationBannerMessage(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI, V.NOTIFICATION_TYPE_ERROR);
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin changes error notification target group to only user");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
      await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies error notification banner is only visible on user side");
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(V.PAGE_USER_SIDE);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessage(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI, V.NOTIFICATION_TYPE_ERROR);
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin changes error notification target group to only admin");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
      await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
      await adminNotificationsCreatePage.adminPublishesNotification();
      await appCommon.reloadPageAndWaitForBannerNotifications();

      await log("Admin verifies error notification banner is only visible on admin side");
      await appCommon.verifyNotificationBannerMessage(V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI, V.NOTIFICATION_TYPE_ERROR);
      await session.switchTo(V.PAGE_USER_SIDE);
      await appCommon.reloadPageAndWaitForBannerNotifications();
      await appCommon.verifyNotificationBannerMessageIsNotVisible();
      await session.switchTo(V.PAGE_ADMIN_SIDE);
      await log("Admin deletes error notification");
      await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
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
        await graphqlCommands.deleteNotificationsByNamePattern(V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
        await log("Admin creates normal notification");
        await adminNavigationMenu.adminNavigatesToNotifications();
        await appAdmin.adminCreatesNormalNotificationForUserAndAdminSide();

        await log("Admin verifies notification banner is created");
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
          V.NOTIFICATION_TYPE_NORMAL
        );
        await log("Admin drafts notification");
        await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
        await adminNotificationsCreatePage.adminDraftsNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();

        await log("Admin verifies notification banner is drafted and not visible");
        await appCommon.verifyNotificationBannerMessageIsNotVisible();

        await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(V.URL_TEST);
        await session.switchTo(V.PAGE_USER_SIDE);
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(V.PAGE_ADMIN_SIDE);

        await log("Admin checks notification is published from drafted state");
        await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
          V.NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(V.PAGE_USER_SIDE);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
          V.NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(V.PAGE_ADMIN_SIDE);

        await log("Admin deletes notification");
        await adminNotifications.adminClicksNotificationName(V.NOTIFICATION_BANNER_MESSAGE_NAME);
        await adminNotificationsCreatePage.adminDeletesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await adminNotifications.adminVerifiesNotificationIsNotFound(V.NOTIFICATION_BANNER_MESSAGE_NAME);
      }
    );
  }
);
