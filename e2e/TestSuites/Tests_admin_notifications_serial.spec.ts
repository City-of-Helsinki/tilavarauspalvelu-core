/** Admin notification tests that must run serially */
import { Browser } from "../lib/Browser";
import { BuiltIn } from "../lib/BuiltIn";
import { V } from "../lib/robot";
import { test } from "./fixtures";
import { admin_navigation_menu } from "./PO/Admin/admin_navigation_menu";
import { admin_notifications } from "./PO/Admin/admin_notifications";
import { admin_notifications_create_page } from "./PO/Admin/admin_notifications_create_page";
import { app_admin } from "./PO/App/app_admin";
import { app_common } from "./PO/App/app_common";
import { popups } from "./PO/Common/popups";
import { common_setups_teardowns } from "./Resources/common_setups_teardowns";
import { graphql_commands } from "./Resources/graphql_commands";
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
    test.beforeEach(async () => {
      await app_common["User Opens Desktop Browser To Landing Page"]();
    });

    test.afterEach(async () => {
      await common_setups_teardowns["Complete Test Teardown"]();
    });

    test("Admin creates normal notifications for both sides", async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await BuiltIn["Log"]("Test cleanup");
      // This is for test cleanup if the last run failed
      await popups["Close Notification Banner If Visible"]();
      await app_common["Admin Goes To Landing Page"]();
      await app_common["Admin Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("Test cleanup");
      // This is for test cleanup if the last run failed
      await graphql_commands["Draft All Banner Notifications"]();
      await graphql_commands["Delete Notifications By Name Pattern"](V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await BuiltIn["Log"]("Admin creates normal notification for both sides");
      await admin_navigation_menu["Admin Navigates To Notifications"]();
      await app_admin["Admin Creates Normal Notification For User And Admin Side"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies notification banner is created");
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await app_common["Open New Window From Admin Side To User Side And Saves Both Windows"](V.URL_TEST);
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin changes notification target group to only user");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
      await admin_notifications_create_page["Admin Selects Target Group User"]();
      await admin_notifications_create_page["Admin Publishes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies notification banner is only visible on user side");
      await app_common["Verify Notification Banner Message Is Not Visible"]();
      await Browser["Switch Page"](V.PAGE_USER_SIDE);
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin changes notification target group to only admin");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
      await admin_notifications_create_page["Admin Selects Target Group Admin"]();
      await admin_notifications_create_page["Admin Publishes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies notification banner is only visible on admin side");
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_NORMAL
      );
      await Browser["Switch Page"](V.PAGE_USER_SIDE);
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message Is Not Visible"]();
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin deletes notification");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
      await admin_notifications_create_page["Admin Deletes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message Is Not Visible"]();
    });

    test("Admin creates warning notifications for both sides", async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await BuiltIn["Log"]("Test cleanup");
      // This is for test cleanup if the last run failed
      await popups["Close Notification Banner If Visible"]();
      await app_common["Admin Goes To Landing Page"]();
      await app_common["Admin Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("Test cleanup");
      // This is for test cleanup if the last run failed
      await graphql_commands["Draft All Banner Notifications"]();
      await graphql_commands["Delete Notifications By Name Pattern"](V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await BuiltIn["Log"]("Admin creates warning notification for both sides");
      await admin_navigation_menu["Admin Navigates To Notifications"]();
      await app_admin["Admin Creates Warning Notification For User And Admin Side"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies warning notification banner is created");
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await app_common["Open New Window From Admin Side To User Side And Saves Both Windows"](V.URL_TEST);
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin changes warning notification target group to only user");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
      await admin_notifications_create_page["Admin Selects Target Group User"]();
      await admin_notifications_create_page["Admin Publishes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies warning notification banner is only visible on user side");
      await app_common["Verify Notification Banner Message Is Not Visible"]();
      await Browser["Switch Page"](V.PAGE_USER_SIDE);
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin changes warning notification target group to only admin");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
      await admin_notifications_create_page["Admin Selects Target Group Admin"]();
      await admin_notifications_create_page["Admin Publishes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies warning notification banner is only visible on admin side");
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_WARNING
      );
      await Browser["Switch Page"](V.PAGE_USER_SIDE);
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message Is Not Visible"]();
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin deletes warning notification");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_WARNING);
      await admin_notifications_create_page["Admin Deletes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message Is Not Visible"]();
    });

    test("Admin creates error notifications for both sides", async () => {
      await common_setups_teardowns["Complete Test Setup From Tags"]();
      await BuiltIn["Log"]("Test cleanup");
      // This is for test cleanup if the last run failed
      await popups["Close Notification Banner If Visible"]();
      await app_common["Admin Goes To Landing Page"]();
      await app_common["Admin Logs In With Suomi Fi"]();

      await BuiltIn["Log"]("Test cleanup");
      // This is for test cleanup if the last run failed
      await graphql_commands["Draft All Banner Notifications"]();
      await graphql_commands["Delete Notifications By Name Pattern"](V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
      await BuiltIn["Log"]("Admin creates error notification for both sides");
      await admin_navigation_menu["Admin Navigates To Notifications"]();
      await app_admin["Admin Creates Error Notification For User And Admin Side"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies error notification banner is created");
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_ERROR
      );
      await app_common["Open New Window From Admin Side To User Side And Saves Both Windows"](V.URL_TEST);
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_ERROR
      );
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin changes error notification target group to only user");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
      await admin_notifications_create_page["Admin Selects Target Group User"]();
      await admin_notifications_create_page["Admin Publishes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies error notification banner is only visible on user side");
      await app_common["Verify Notification Banner Message Is Not Visible"]();
      await Browser["Switch Page"](V.PAGE_USER_SIDE);
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_ERROR
      );
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin changes error notification target group to only admin");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
      await admin_notifications_create_page["Admin Selects Target Group Admin"]();
      await admin_notifications_create_page["Admin Publishes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();

      await BuiltIn["Log"]("Admin verifies error notification banner is only visible on admin side");
      await app_common["Verify Notification Banner Message"](
        V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
        V.NOTIFICATION_TYPE_ERROR
      );
      await Browser["Switch Page"](V.PAGE_USER_SIDE);
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message Is Not Visible"]();
      await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);
      await BuiltIn["Log"]("Admin deletes error notification");
      await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME_ERROR);
      await admin_notifications_create_page["Admin Deletes Notification"]();
      await app_common["Reload Page And Wait For Banner Notifications"]();
      await app_common["Verify Notification Banner Message Is Not Visible"]();
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
      async () => {
        await common_setups_teardowns["Complete Test Setup From Tags"]();

        await BuiltIn["Log"]("Test cleanup");
        // This is for test cleanup if the last run failed
        await popups["Close Notification Banner If Visible"]();
        await app_common["Admin Goes To Landing Page"]();
        await app_common["Admin Logs In With Suomi Fi"]();

        await BuiltIn["Log"]("Test cleanup");
        // This is for test cleanup if the last run failed
        await graphql_commands["Draft All Banner Notifications"]();
        await graphql_commands["Delete Notifications By Name Pattern"](V.NOTIFICATION_BANNER_CLEANUP_PATTERN);
        await BuiltIn["Log"]("Admin creates normal notification");
        await admin_navigation_menu["Admin Navigates To Notifications"]();
        await app_admin["Admin Creates Normal Notification For User And Admin Side"]();

        await BuiltIn["Log"]("Admin verifies notification banner is created");
        await app_common["Reload Page And Wait For Banner Notifications"]();
        await app_common["Verify Notification Banner Message"](
          V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
          V.NOTIFICATION_TYPE_NORMAL
        );
        await BuiltIn["Log"]("Admin drafts notification");
        await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
        await admin_notifications_create_page["Admin Drafts Notification"]();
        await app_common["Reload Page And Wait For Banner Notifications"]();

        await BuiltIn["Log"]("Admin verifies notification banner is drafted and not visible");
        await app_common["Verify Notification Banner Message Is Not Visible"]();

        await app_common["Open New Window From Admin Side To User Side And Saves Both Windows"](V.URL_TEST);
        await Browser["Switch Page"](V.PAGE_USER_SIDE);
        await app_common["Verify Notification Banner Message Is Not Visible"]();
        await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);

        await BuiltIn["Log"]("Admin checks notification is published from drafted state");
        await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
        await admin_notifications_create_page["Admin Publishes Notification"]();
        await app_common["Reload Page And Wait For Banner Notifications"]();
        await app_common["Verify Notification Banner Message"](
          V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
          V.NOTIFICATION_TYPE_NORMAL
        );
        await Browser["Switch Page"](V.PAGE_USER_SIDE);
        await app_common["Reload Page And Wait For Banner Notifications"]();
        await app_common["Verify Notification Banner Message"](
          V.NOTIFICATION_BANNER_MESSAGE_TEXT_FI,
          V.NOTIFICATION_TYPE_NORMAL
        );
        await Browser["Switch Page"](V.PAGE_ADMIN_SIDE);

        await BuiltIn["Log"]("Admin deletes notification");
        await admin_notifications["Admin Clicks Notification Name"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
        await admin_notifications_create_page["Admin Deletes Notification"]();
        await app_common["Reload Page And Wait For Banner Notifications"]();
        await app_common["Verify Notification Banner Message Is Not Visible"]();
        await admin_notifications["Admin Verifies Notification Is Not Found"](V.NOTIFICATION_BANNER_MESSAGE_NAME);
      }
    );
  }
);
