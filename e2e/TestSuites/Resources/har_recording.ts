/** Simple HAR Recording for Robot Framework Test Suite */
import { Browser } from "../../lib/Browser";
import { BuiltIn } from "../../lib/BuiltIn";
import { Collections } from "../../lib/Collections";
import { DateTime } from "../../lib/DateTime";
import { OperatingSystem } from "../../lib/OperatingSystem";
import { V, keywords, named, pyBool, registerVariables, robot, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import { String_ } from "../../lib/String";
import "../Resources/variables";

export const har_recording_variables = {
  HAR_OUTPUT_DIR: `${str(import.meta.dirname)}${str("/")}..${str("/")}..${str("/")}output${str("/")}har_files`,
  CURRENT_HAR_PATH: "",
  LOCALE: "en-US",
};
registerVariables(har_recording_variables);

export const har_recording = keywords("har_recording", {
  /** Creates a browser context with optional HAR recording based on ENABLE_HAR_RECORDING variable */
  "Create Context With Optional HAR": async (context_config: RobotValue, browser_type: RobotValue = "UNKNOWN") => {
    let har_enabled: RobotValue, original_log_level: RobotValue, contextId: RobotValue;
    har_enabled = V.ENABLE_HAR_RECORDING ?? false;

    // Convert string values to boolean for proper evaluation
    if (str(har_enabled) === "True" || str(har_enabled) === "True" || har_enabled === true) {
      har_enabled = true;
    } else {
      har_enabled = false;
    }

    if (pyBool(har_enabled)) {
      await BuiltIn["Log"]("📹 HAR recording enabled - creating HAR-enabled context");
      await har_recording["Start HAR Recording For Context"](browser_type, context_config);
      // Temporarily suppress logging to prevent sensitive headers from being logged
      original_log_level = await BuiltIn["Set Log Level"]("NONE");
      contextId = await Browser["New Context"](named(context_config));
      await BuiltIn["Set Log Level"](original_log_level);
      await BuiltIn["Log"]("✅ HAR-enabled context created");
    } else {
      await BuiltIn["Log"]("📹 HAR recording disabled - creating standard context");
      // Temporarily suppress logging to prevent sensitive headers from being logged
      original_log_level = await BuiltIn["Set Log Level"]("NONE");
      contextId = await Browser["New Context"](named(context_config));
      await BuiltIn["Set Log Level"](original_log_level);
      await BuiltIn["Log"]("✅ Standard context created");
    }

    return contextId;
  },

  /** Creates a unique HAR file path based on test context and timestamp */
  "Generate Unique HAR File Path": async (browser_type: RobotValue = "unknown") => {
    let test_name: RobotValue,
      suite_name: RobotValue,
      pool_id: RobotValue,
      timestamp: RobotValue,
      clean_test_name: RobotValue,
      clean_suite_name: RobotValue,
      har_filename: RobotValue,
      har_path: RobotValue;
    // Get test execution context
    test_name = robot.TEST_NAME ?? "unknown_test";
    suite_name = robot.SUITE_NAME ?? "unknown_suite";
    pool_id = robot.PABOTEXECUTIONPOOLID ?? "single";

    // Create timestamp for uniqueness
    timestamp = await DateTime["Get Current Date"](named({ result_format: "%Y%m%d_%H%M%S_%f" }));
    timestamp = await String_["Get Substring"](timestamp, "0", "17");

    // Sanitize names for filesystem
    clean_test_name = await String_["Replace String"](test_name, " ", "_");
    clean_suite_name = await String_["Replace String"](suite_name, " ", "_");
    clean_suite_name = await String_["Replace String"](clean_suite_name, ".", "-");

    // Build HAR filename
    har_filename = `pool${str(pool_id)}_${str(browser_type)}_${str(clean_suite_name)}_${str(clean_test_name)}_${str(timestamp)}.har`;

    // Ensure output directory exists
    await OperatingSystem["Create Directory"](V.HAR_OUTPUT_DIR);

    har_path = await OperatingSystem["Join Path"](V.HAR_OUTPUT_DIR, har_filename);
    return har_path;
  },

  /** Enables HAR recording for a browser context */
  "Start HAR Recording For Context": async (browser_type: RobotValue, context_config: RobotValue) => {
    let har_path: RobotValue, har_config: RobotValue;
    // Generate unique HAR file path
    har_path = await har_recording["Generate Unique HAR File Path"](browser_type);
    V.CURRENT_HAR_PATH = har_path;

    // Create HAR configuration
    har_config = { path: har_path, omitContent: false };

    // Add HAR recording to context configuration
    await Collections["Set To Dictionary"](context_config, named({ recordHar: har_config }));

    return context_config;
  },

  /** Creates Chromium context with HAR recording enabled */
  "Create HAR-Enabled Chromium Context": async () => {
    let context_config: RobotValue, contextId: RobotValue;
    context_config = {
      viewport: "{'width': 1440, 'height': 900}",
      acceptDownloads: "True",
      locale: V.LOCALE,
      timezoneId: "Europe/Helsinki",
      ignoreHTTPSErrors: "true",
      deviceScaleFactor: "1",
    };

    context_config = await har_recording["Start HAR Recording For Context"]("CHROMIUM", context_config);
    contextId = await Browser["New Context"](named(context_config));

    return contextId;
  },

  /** Creates Firefox context with HAR recording enabled */
  "Create HAR-Enabled Firefox Context": async () => {
    let context_config: RobotValue, contextId: RobotValue;
    context_config = {
      viewport: "{'width': 1920, 'height': 1080}",
      acceptDownloads: "True",
      locale: V.LOCALE,
      timezoneId: "Europe/Helsinki",
      ignoreHTTPSErrors: "true",
    };

    context_config = await har_recording["Start HAR Recording For Context"]("FIREFOX", context_config);
    contextId = await Browser["New Context"](named(context_config));

    return contextId;
  },

  /** Creates mobile device context with HAR recording enabled */
  "Create HAR-Enabled Mobile Context": async (device_name: RobotValue) => {
    let device_config: RobotValue, device_type: RobotValue, contextId: RobotValue;
    device_config = await Browser["Get Device"](device_name);
    await Collections["Set To Dictionary"](device_config, named({ locale: V.LOCALE }));

    device_type = await String_["Replace String"](device_name, " ", "_");
    device_config = await har_recording["Start HAR Recording For Context"](device_type, device_config);
    contextId = await Browser["New Context"](named(device_config));

    return contextId;
  },
});
