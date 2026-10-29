/**
 * Unified setup and teardown keywords for all test suites
 * Simple approach: One setup does everything, one teardown cleans everything
 */
import { test } from "@playwright/test";
import { step, log } from "../../lib/runtime";
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
    const info = test.info();
    // Port: the testData fixture (TestSuites/test-data.ts) chose the users and units from the tags before the test
    // started; this logs them
    await log(`🚀 Test data for: ${info.title}`);
    await log(`🏷️ Tags: ${info.tags.join(", ")}`);
    const { user, admin, djangoAdmin, permissionTarget } = this.testData;
    for (const [kind, person] of Object.entries({ user, admin, djangoAdmin, permissionTarget })) {
      if (person.fullName !== "") {
        // oxlint-disable-next-line no-await-in-loop -- log lines in order
        await log(`👤 ${kind}: ${person.fullName}`);
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
