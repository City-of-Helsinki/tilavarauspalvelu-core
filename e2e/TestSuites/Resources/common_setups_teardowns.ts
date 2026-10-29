/**
 * Unified setup and teardown keywords for all test suites
 * Simple approach: One setup does everything, one teardown cleans everything
 */
import { V, robot, str, step, log } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/suite_specific_units";
import "../Resources/variables";
import "../Resources/serial_users";
import "../Resources/devices";
import { PageObject } from "../page-object";

export class CommonSetupsTeardowns extends PageObject {
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
  @step("common_setups_teardowns.Complete Test Setup From Tags")
  async completeTestSetupFromTags() {
    let test_name: RobotValue;
    test_name = robot.TEST_NAME ?? "unknown_test";
    // Port: the testData fixture (TestSuites/fixtures.ts) chose the users and units from the tags before the test
    // started; this logs them
    await log(`🚀 Test data for: ${str(test_name)}`);
    await log(`🏷️ Tags: ${str(robot.TEST_TAGS)}`);
    for (const name of [
      "CURRENT_USER_FULLNAME",
      "ADMIN_CURRENT_USER_FULLNAME",
      "DJANGO_ADMIN_FULLNAME",
      "PERMISSION_TARGET_ADMIN_FULLNAME",
    ] as const) {
      if (str(V[name] ?? "") !== "") {
        await log(`👤 ${name}: ${V[name]}`);
      }
    }
  }

  // =============================================================================
  // TEST TEARDOWN
  // =============================================================================
  /** Complete teardown with session cleanup */
  @step("common_setups_teardowns.Complete Test Teardown")
  async completeTestTeardown() {
    // Port: Playwright takes full-page failure screenshots of the open pages when the test fails (the screenshot
    // option in playwright.config.ts), so there's no Sleep and Take Screenshot here
    // Cleanup process (the testData fixture releases the data set). Closes the contexts and browsers the test opened
    // itself; Playwright closes its own. An error is ignored, like Run Keyword And Ignore Error.
    try {
      await this.pages.session?.close();
    } catch {
      // ignored
    }
  }
}
