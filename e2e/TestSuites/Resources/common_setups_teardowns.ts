/**
 * Unified setup and teardown keywords for all test suites
 * Simple approach: One setup does everything, one teardown cleans everything
 */
import { Browser } from "../../lib/Browser";
import { BuiltIn } from "../../lib/BuiltIn";
import { keywords, robot, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import { parallel_test_data } from "../Resources/parallel_test_data";
import { suite_unit_selector } from "../Resources/suite_unit_selector";
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
    await BuiltIn["Log"](`🚀 Starting tag-based setup for: ${str(test_name)}`);

    // Initialize suite-specific units from tags
    await suite_unit_selector["Initialize Suite Units From Tags"]();

    // Initialize test data (users) from tags
    await parallel_test_data["Initialize Test Data From Tags"]();

    await BuiltIn["Log"]("✓ Test setup completed successfully");

    // =============================================================================
    // TEST TEARDOWN
    // =============================================================================
  },

  /** Complete teardown with session cleanup */
  "Complete Test Teardown": async () => {
    // Always take screenshot on failure, after giving the page a moment to settle
    await BuiltIn["Run Keyword If Test Failed"](BuiltIn["Sleep"], "2s");
    await BuiltIn["Run Keyword If Test Failed"](Browser["Take Screenshot"], "EMBED");

    // Cleanup process
    await parallel_test_data["Release Test Data"]();
    await BuiltIn["Run Keyword And Ignore Error"](Browser["Close Browser"]);
  },
});
