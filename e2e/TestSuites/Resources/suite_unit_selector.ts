/** Suite-specific unit selector for parallel execution */
import { BuiltIn } from "../../lib/BuiltIn";
import { V, keywords, robot, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/suite_specific_units";
import "../Resources/variables";

export const suite_unit_selector = keywords("suite_unit_selector", {
  // =============================================================================
  // TAG-BASED SUITE UNIT INITIALIZATION
  // =============================================================================
  /**
   * Tag-based suite unit initialization
   * Automatically determines which suite units to load based on test tags:
   * - desktop-suite: Desktop user test units
   * - admin-suite: Admin test units
   * - combined-suite: Combined admin+user units
   * - android-suite: Android mobile units
   * - iphone-suite: iPhone mobile units
   * EXAMPLE TAGS:
   * [Tags]
   * desktop-test-data-set-0
   * desktop-suite
   * smoke
   * [Tags]
   * admin-test-data-set-2
   * admin-suite
   * general-permissions-test
   */
  "Initialize Suite Units From Tags": async () => {
    let test_tags: RobotValue, test_name: RobotValue;
    test_tags = robot.TEST_TAGS ?? "[]";
    test_name = robot.TEST_NAME ?? "unknown_test";

    await BuiltIn["Log"](`🏷️ Initializing suite units from tags for: ${str(test_name)}`);
    await BuiltIn["Log"](`🏷️ Tags: ${str(test_tags)}`);

    // Check for suite type tags
    if (test_tags.includes("desktop-suite")) {
      await BuiltIn["Log"]("📱 Loading desktop suite units");
      await suite_unit_selector["Set Desktop Suite Units"]();
    } else if (test_tags.includes("admin-suite")) {
      await BuiltIn["Log"]("👨‍💼 Loading admin suite units");
      await suite_unit_selector["Set Admin Suite Units"]();
    } else if (test_tags.includes("combined-suite")) {
      await BuiltIn["Log"]("🔄 Loading combined suite units");
      await suite_unit_selector["Set Combined Suite Units"]();
    } else if (test_tags.includes("android-suite")) {
      await BuiltIn["Log"]("📱 Loading Android suite units");
      await suite_unit_selector["Set Android Suite Units"]();
    } else if (test_tags.includes("iphone-suite")) {
      await BuiltIn["Log"]("📱 Loading iPhone suite units");
      await suite_unit_selector["Set IPhone Suite Units"]();
    } else {
      await BuiltIn["Log"]("⚠️ No suite type tag found, using desktop as default");
      await suite_unit_selector["Set Desktop Suite Units"]();
    }
  },

  /** Set units specific to desktop user tests */
  "Set Desktop Suite Units": () => {
    V.CURRENT_ALWAYS_FREE_UNIT = V.DESKTOP_ALWAYS_FREE_UNIT;
    V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION = V.DESKTOP_ALWAYS_FREE_UNIT_WITH_LOCATION;
    V.CURRENT_ALWAYS_PAID_UNIT = V.DESKTOP_ALWAYS_PAID_UNIT;
    V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION = V.DESKTOP_ALWAYS_PAID_UNIT_WITH_LOCATION;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED = V.DESKTOP_ALWAYS_PAID_UNIT_SUBVENTED;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION = V.DESKTOP_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION;
    V.CURRENT_FREE_UNIT_NO_CANCEL = V.DESKTOP_FREE_UNIT_NO_CANCEL;
    V.CURRENT_FREE_UNIT_NO_CANCEL_WITH_LOCATION = V.DESKTOP_FREE_UNIT_NO_CANCEL_WITH_LOCATION;
    V.CURRENT_UNAVAILABLE_UNIT = V.DESKTOP_UNAVAILABLE_UNIT;
    V.CURRENT_UNAVAILABLE_UNIT_WITH_LOCATION = V.DESKTOP_UNAVAILABLE_UNIT_WITH_LOCATION;
  },

  /** Set units specific to admin tests */
  "Set Admin Suite Units": () => {
    V.CURRENT_UNAVAILABLE_UNIT = V.DESKTOP_UNAVAILABLE_UNIT;
    V.CURRENT_UNAVAILABLE_UNIT_WITH_LOCATION = V.DESKTOP_UNAVAILABLE_UNIT_WITH_LOCATION;
  },

  /** Set units specific to combined user+admin tests */
  "Set Combined Suite Units": () => {
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED = V.COMBINED_ALWAYS_PAID_UNIT_SUBVENTED;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION = V.COMBINED_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION;
    V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING = V.COMBINED_UNIT_REQUIRES_ALWAYS_HANDLING;
    V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION = V.COMBINED_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION;
    V.CURRENT_UNIT_WITH_ACCESS_CODE = V.DESKTOP_UNIT_WITH_ACCESS_CODE;
    V.CURRENT_UNIT_WITH_ACCESS_CODE_WITH_LOCATION = V.DESKTOP_UNIT_WITH_ACCESS_CODE_WITH_LOCATION;
  },

  /** Set units specific to Android mobile tests */
  "Set Android Suite Units": () => {
    V.CURRENT_ALWAYS_FREE_UNIT = V.ANDROID_ALWAYS_FREE_UNIT;
    V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION = V.ANDROID_ALWAYS_FREE_UNIT_WITH_LOCATION;
    V.CURRENT_ALWAYS_PAID_UNIT = V.ANDROID_ALWAYS_PAID_UNIT;
    V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION = V.ANDROID_ALWAYS_PAID_UNIT_WITH_LOCATION;
    V.CURRENT_UNIT_WITH_ACCESS_CODE = V.ANDROID_UNIT_WITH_ACCESS_CODE;
    V.CURRENT_UNIT_WITH_ACCESS_CODE_WITH_LOCATION = V.ANDROID_UNIT_WITH_ACCESS_CODE_WITH_LOCATION;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED = V.ANDROID_ALWAYS_PAID_UNIT_SUBVENTED;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION = V.ANDROID_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION;
    V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING = V.ANDROID_UNIT_REQUIRES_ALWAYS_HANDLING;
    V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION = V.ANDROID_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION;
  },

  /** Set units specific to iPhone mobile tests */
  "Set IPhone Suite Units": () => {
    V.CURRENT_ALWAYS_FREE_UNIT = V.IPHONE_ALWAYS_FREE_UNIT;
    V.CURRENT_ALWAYS_FREE_UNIT_WITH_LOCATION = V.IPHONE_ALWAYS_FREE_UNIT_WITH_LOCATION;
    V.CURRENT_ALWAYS_PAID_UNIT = V.IPHONE_ALWAYS_PAID_UNIT;
    V.CURRENT_ALWAYS_PAID_UNIT_WITH_LOCATION = V.IPHONE_ALWAYS_PAID_UNIT_WITH_LOCATION;
    V.CURRENT_UNIT_WITH_ACCESS_CODE = V.IPHONE_UNIT_WITH_ACCESS_CODE;
    V.CURRENT_UNIT_WITH_ACCESS_CODE_WITH_LOCATION = V.IPHONE_UNIT_WITH_ACCESS_CODE_WITH_LOCATION;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED = V.IPHONE_ALWAYS_PAID_UNIT_SUBVENTED;
    V.CURRENT_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION = V.IPHONE_ALWAYS_PAID_UNIT_SUBVENTED_WITH_LOCATION;
    V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING = V.IPHONE_UNIT_REQUIRES_ALWAYS_HANDLING;
    V.CURRENT_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION = V.IPHONE_UNIT_REQUIRES_ALWAYS_HANDLING_WITH_LOCATION;
  },
});
