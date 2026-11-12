/**
 * Setup and teardown keywords: logging the test data that the tags chose, and closing what the test opened. The
 * fixtures do both for every test (TestSuites/fixtures.ts).
 */
import { test } from "@playwright/test";
import { step, log } from "../../lib/runtime";
import { PageObject } from "../page-object";

export class CommonSetupsTeardowns extends PageObject {
  // =============================================================================
  // TAG-BASED UNIFIED TEST SETUP
  // =============================================================================
  /**
   * Logs the test data that the test's tags chose: a data set tag (user-data-set-0, admin-test-data-set-2, …) picks
   * the users, and admin-suite or combined-suite the units of an admin or combined test. A customer test's units come
   * from its project's platform.
   * EXAMPLE: { tag: ["@user-data-set-0", "@smoke"] }
   */
  @step("common_setups_teardowns.Complete Test Setup From Tags")
  async completeTestSetupFromTags() {
    const info = test.info();
    // The testData fixture (TestSuites/test-data.ts) chose the users and units from the tags before the test
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
    // Playwright takes full-page screenshots of open pages when a test fails (screenshot in playwright.config.ts)
    // This closes the contexts and browsers the test opened itself and ignores errors. Playwright closes its own, and
    // the testData fixture releases the data set.
    try {
      await this.pages.session?.close();
    } catch {
      // ignored
    }
  }
}
