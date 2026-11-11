/** Admin notification tests that must run serially */
import { test } from "./fixtures";
import { NOTIFICATION_BANNER_CLEANUP_PATTERN } from "./Resources/texts_FI";
import {
  NOTIFICATION_ADMIN_STATE,
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
    // The tests start with the admin's login, which the notifications_login project saved before them
    test.use({ storageState: NOTIFICATION_ADMIN_STATE });

    test.beforeEach(async ({ appCommon }) => {
      await appCommon.userOpensBrowserToLandingPage();
    });

    test("Admin creates normal notifications for both sides", async ({
      adminNavigationMenu,
      adminNotifications,
      adminNotificationsCreatePage,
      appAdmin,
      appCommon,
      graphqlCommands,
      popups,
      session,
      state,
    }) => {
      await test.step("Test cleanup", async () => {
        // This is for test cleanup if the last run failed
        await popups.closeNotificationBannerIfVisible();
        await appCommon.adminGoesToLandingPageLoggedIn();

        // This is for test cleanup if the last run failed
        await graphqlCommands.draftAllBannerNotifications();
        await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
      });

      await test.step("Admin creates normal notification for both sides", async () => {
        await adminNavigationMenu.adminNavigatesToNotifications();
        await appAdmin.adminCreatesNormalNotificationForUserAndAdminSide();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies notification banner is created", async () => {
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin changes notification target group to only user", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
        await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies notification banner is only visible on user side", async () => {
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin changes notification target group to only admin", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
        await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies notification banner is only visible on admin side", async () => {
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_NORMAL
        );
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin deletes notification", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
        await adminNotificationsCreatePage.adminDeletesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
      });
    });

    test("Admin creates warning notifications for both sides", async ({
      adminNavigationMenu,
      adminNotifications,
      adminNotificationsCreatePage,
      appAdmin,
      appCommon,
      graphqlCommands,
      popups,
      session,
      state,
    }) => {
      await test.step("Test cleanup", async () => {
        // This is for test cleanup if the last run failed
        await popups.closeNotificationBannerIfVisible();
        await appCommon.adminGoesToLandingPageLoggedIn();

        // This is for test cleanup if the last run failed
        await graphqlCommands.draftAllBannerNotifications();
        await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
      });

      await test.step("Admin creates warning notification for both sides", async () => {
        await adminNavigationMenu.adminNavigatesToNotifications();
        await appAdmin.adminCreatesWarningNotificationForUserAndAdminSide();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies warning notification banner is created", async () => {
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_WARNING
        );
        await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_WARNING
        );
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin changes warning notification target group to only user", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameWarning);
        await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies warning notification banner is only visible on user side", async () => {
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_WARNING
        );
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin changes warning notification target group to only admin", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameWarning);
        await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies warning notification banner is only visible on admin side", async () => {
        await appCommon.verifyNotificationBannerMessage(
          state.notificationBannerMessageTextFi,
          NOTIFICATION_TYPE_WARNING
        );
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin deletes warning notification", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameWarning);
        await adminNotificationsCreatePage.adminDeletesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
      });
    });

    test("Admin creates error notifications for both sides", async ({
      adminNavigationMenu,
      adminNotifications,
      adminNotificationsCreatePage,
      appAdmin,
      appCommon,
      graphqlCommands,
      popups,
      session,
      state,
    }) => {
      await test.step("Test cleanup", async () => {
        // This is for test cleanup if the last run failed
        await popups.closeNotificationBannerIfVisible();
        await appCommon.adminGoesToLandingPageLoggedIn();

        // This is for test cleanup if the last run failed
        await graphqlCommands.draftAllBannerNotifications();
        await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
      });

      await test.step("Admin creates error notification for both sides", async () => {
        await adminNavigationMenu.adminNavigatesToNotifications();
        await appAdmin.adminCreatesErrorNotificationForUserAndAdminSide();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies error notification banner is created", async () => {
        await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
        await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
        await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin changes error notification target group to only user", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameError);
        await adminNotificationsCreatePage.adminSelectsTargetGroupUser();
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies error notification banner is only visible on user side", async () => {
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin changes error notification target group to only admin", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameError);
        await adminNotificationsCreatePage.adminSelectsTargetGroupAdmin();
        await adminNotificationsCreatePage.adminPublishesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
      });

      await test.step("Admin verifies error notification banner is only visible on admin side", async () => {
        await appCommon.verifyNotificationBannerMessage(state.notificationBannerMessageTextFi, NOTIFICATION_TYPE_ERROR);
        await session.switchTo(state.pageUserSide);
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
        await session.switchTo(state.pageAdminSide);
      });

      await test.step("Admin deletes error notification", async () => {
        await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageNameError);
        await adminNotificationsCreatePage.adminDeletesNotification();
        await appCommon.reloadPageAndWaitForBannerNotifications();
        await appCommon.verifyNotificationBannerMessageIsNotVisible();
      });
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
        graphqlCommands,
        popups,
        session,
        state,
      }) => {
        await test.step("Test cleanup", async () => {
          // This is for test cleanup if the last run failed
          await popups.closeNotificationBannerIfVisible();
          await appCommon.adminGoesToLandingPageLoggedIn();

          // This is for test cleanup if the last run failed
          await graphqlCommands.draftAllBannerNotifications();
          await graphqlCommands.deleteNotificationsByNamePattern(NOTIFICATION_BANNER_CLEANUP_PATTERN);
        });

        await test.step("Admin creates normal notification", async () => {
          await adminNavigationMenu.adminNavigatesToNotifications();
          await appAdmin.adminCreatesNormalNotificationForUserAndAdminSide();
        });

        await test.step("Admin verifies notification banner is created", async () => {
          await appCommon.reloadPageAndWaitForBannerNotifications();
          await appCommon.verifyNotificationBannerMessage(
            state.notificationBannerMessageTextFi,
            NOTIFICATION_TYPE_NORMAL
          );
        });

        await test.step("Admin drafts notification", async () => {
          await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
          await adminNotificationsCreatePage.adminDraftsNotification();
          await appCommon.reloadPageAndWaitForBannerNotifications();
        });

        await test.step("Admin verifies notification banner is drafted and not visible", async () => {
          await appCommon.verifyNotificationBannerMessageIsNotVisible();

          await appCommon.openNewWindowFromAdminSideToUserSideAndSavesBothWindows(URL_TEST);
          await session.switchTo(state.pageUserSide);
          await appCommon.verifyNotificationBannerMessageIsNotVisible();
          await session.switchTo(state.pageAdminSide);
        });

        await test.step("Admin checks notification is published from drafted state", async () => {
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
        });

        await test.step("Admin deletes notification", async () => {
          await adminNotifications.adminClicksNotificationName(state.notificationBannerMessageName);
          await adminNotificationsCreatePage.adminDeletesNotification();
          await appCommon.reloadPageAndWaitForBannerNotifications();
          await appCommon.verifyNotificationBannerMessageIsNotVisible();
          await adminNotifications.adminVerifiesNotificationIsNotFound(state.notificationBannerMessageName);
        });
      }
    );
  }
);
