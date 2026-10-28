/**
 * Unified setup and teardown keywords for all test suites
 * Simple approach: One setup does everything, one teardown cleans everything
 */
import { Browser } from "../../lib/Browser";
import { BuiltIn } from "../../lib/BuiltIn";
import { V, keywords, robot, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/suite_specific_units";
import "../Resources/variables";
import "../Resources/serial_users";
import "../Resources/devices";
import "../Resources/har_recording";

export const common_setups_teardowns = keywords("common_setups_teardowns", {
  // =============================================================================
  // TAG-BASED UNIFIED TEST SETUP
  // =============================================================================
  /**
   * Tag-based test setup
   * Automatically initializes test data and suite units based on test tags.
   * REQUIRED TAGS on each test:
   * - Data set tag: desktop-test-data-set-0, admin-test-data-set-2, etc.
   * - Suite type tag: desktop-suite, admin-suite, combined-suite, android-suite, iphone-suite
   * EXAMPLE:
   * Test Case
   * [Tags]
   * desktop-test-data-set-0
   * desktop-suite
   * smoke
   */
  "Complete Test Setup From Tags": async () => {
    let test_name: RobotValue;
    test_name = robot.TEST_NAME ?? "unknown_test";
    // Port: the testData fixture (TestSuites/fixtures.ts) chose the users and units from the tags before the test
    // started; this logs them
    await BuiltIn["Log"](`🚀 Test data for: ${str(test_name)}`);
    await BuiltIn["Log"](`🏷️ Tags: ${str(robot.TEST_TAGS)}`);
    for (const name of [
      "CURRENT_USER_FULLNAME",
      "ADMIN_CURRENT_USER_FULLNAME",
      "DJANGO_ADMIN_FULLNAME",
      "PERMISSION_TARGET_ADMIN_FULLNAME",
    ]) {
      if (str(V[name] ?? "") !== "") {
        await BuiltIn["Log"](`👤 ${name}: ${str(V[name])}`);
      }
    }

    // =============================================================================
    // TEST TEARDOWN
    // =============================================================================
  },

  /** Complete teardown with session cleanup */
  "Complete Test Teardown": async () => {
    // Port: Playwright takes full-page failure screenshots of the open pages when the test fails (the screenshot
    // option in playwright.config.ts), so there's no Sleep and Take Screenshot here
    // imports: Browser

    // Cleanup process (the testData fixture releases the data set)
    await BuiltIn["Run Keyword And Ignore Error"](Browser["Close Browser"]);
  },
});
