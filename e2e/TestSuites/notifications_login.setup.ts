/**
 * Logs the notification suite's admin in once and saves the login, so that the suite's tests start on the admin UI
 * already logged in (`storageState`). The notification suite's project depends on this one.
 */
import { test } from "./fixtures";
import { NOTIFICATION_ADMIN_STATE } from "./Resources/variables";

test(
  "Admin logs in for the notification tests",
  // The notification suite's tags, so the same admin logs in
  { tag: ["@combined-test-data-set-0", "@combined-suite", "@serialonly"] },
  async ({ appCommon, session }) => {
    await appCommon.adminOpensDesktopBrowserToLandingPage();
    await appCommon.adminLogsInWithSuomiFi();
    await session.page.context().storageState({ path: NOTIFICATION_ADMIN_STATE });
  }
);
