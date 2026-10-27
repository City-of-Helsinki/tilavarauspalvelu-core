/**
 * Test data that tests share with each other while they run in parallel: the paid booking test tells the email test
 * its booking and whether it has finished. The values are PabotLib's parallel values, which every worker sees.
 *
 * The users of each test come from its tags through the testData fixture (TestSuites/fixtures.ts).
 */
import { BuiltIn } from "../../lib/BuiltIn";
import { PabotLib } from "../../lib/PabotLib";
import { V, isTruthy, keywords, registerVariables, str, testInfo } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/serial_users";

export const parallel_test_data_variables = {
  FORCE_SINGLE_USER: false,
};
registerVariables(parallel_test_data_variables);

export const parallel_test_data = keywords("parallel_test_data", {
  // =============================================================================
  // MAIL TEST DATA MANAGEMENT (for cross-test data sharing)
  // =============================================================================
  /** Stores mail-related test data for cross-test access */
  "Store Mail Test Data": async (
    reservation_number: RobotValue,
    reservation_time: RobotValue,
    unit_name: RobotValue,
    formatted_start_time: RobotValue,
    formatted_end_time: RobotValue
  ) => {
    let status: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](
      PabotLib["Set Parallel Value For Key"],
      "MAIL_RESERVATION_NUMBER",
      reservation_number
    );
    if (isTruthy(status)) {
      await PabotLib["Set Parallel Value For Key"]("MAIL_RESERVATION_TIME", reservation_time);
      await PabotLib["Set Parallel Value For Key"]("MAIL_UNIT_NAME", unit_name);
      await PabotLib["Set Parallel Value For Key"]("MAIL_FORMATTED_START_TIME", formatted_start_time);
      await PabotLib["Set Parallel Value For Key"]("MAIL_FORMATTED_END_TIME", formatted_end_time);
      await BuiltIn["Log"]("✓ Stored mail test data using PabotLib");
    } else {
      V.MAIL_RESERVATION_NUMBER = reservation_number;
      V.MAIL_RESERVATION_TIME = reservation_time;
      V.MAIL_UNIT_NAME = unit_name;
      V.MAIL_FORMATTED_START_TIME = formatted_start_time;
      V.MAIL_FORMATTED_END_TIME = formatted_end_time;
      await BuiltIn["Log"]("✓ Stored mail test data as test variables (fallback)");
    }
  },

  /** Retrieves mail-related test data for verification */
  "Get Mail Test Data": async () => {
    let status: RobotValue,
      reservation_number: RobotValue,
      reservation_time: RobotValue,
      unit_name: RobotValue,
      formatted_start_time: RobotValue,
      formatted_end_time: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](
      PabotLib["Get Parallel Value For Key"],
      "MAIL_RESERVATION_NUMBER"
    );
    if (isTruthy(status)) {
      reservation_number = await PabotLib["Get Parallel Value For Key"]("MAIL_RESERVATION_NUMBER");
      reservation_time = await PabotLib["Get Parallel Value For Key"]("MAIL_RESERVATION_TIME");
      unit_name = await PabotLib["Get Parallel Value For Key"]("MAIL_UNIT_NAME");
      formatted_start_time = await PabotLib["Get Parallel Value For Key"]("MAIL_FORMATTED_START_TIME");
      formatted_end_time = await PabotLib["Get Parallel Value For Key"]("MAIL_FORMATTED_END_TIME");
      await BuiltIn["Log"]("✓ Retrieved mail test data using PabotLib");
    } else {
      reservation_number = V.MAIL_RESERVATION_NUMBER ?? "";
      reservation_time = V.MAIL_RESERVATION_TIME ?? "";
      unit_name = V.MAIL_UNIT_NAME ?? "";
      formatted_start_time = V.MAIL_FORMATTED_START_TIME ?? "";
      formatted_end_time = V.MAIL_FORMATTED_END_TIME ?? "";
      await BuiltIn["Log"]("✓ Retrieved mail test data from test variables (fallback)");
    }

    return [reservation_number, reservation_time, unit_name, formatted_start_time, formatted_end_time];

    // =============================================================================
    // BACKWARD COMPATIBILITY KEYWORDS
    // =============================================================================
  },

  /** Stores a value that the other workers see too (a PabotLib parallel value) */
  "Store Test Data Variable": async (variable_name: RobotValue, value: RobotValue) => {
    let status: RobotValue;
    status = await BuiltIn["Run Keyword And Return Status"](
      PabotLib["Set Parallel Value For Key"],
      variable_name,
      value
    );
    if (isTruthy(status)) {
      await BuiltIn["Log"](`Stored ${str(variable_name)} = ${str(value)} as a parallel value`);
    } else {
      V[variable_name] = value;
      await BuiltIn["Log"](`Stored ${str(variable_name)} = ${str(value)} as test variable (fallback)`);
    }
  },

  /** Gets a value that a test stored with Store Test Data Variable, or the default */
  "Get Test Data Variable": async (variable_name: RobotValue, default_value: RobotValue = "") => {
    let status: RobotValue, value: RobotValue;
    await BuiltIn["Log"](`DEBUG: Getting variable '${str(variable_name)}' with default '${str(default_value)}'`);
    status = await BuiltIn["Run Keyword And Return Status"](PabotLib["Get Parallel Value For Key"], variable_name);
    if (isTruthy(status)) {
      value = await PabotLib["Get Parallel Value For Key"](variable_name);
      await BuiltIn["Log"](`DEBUG: PabotLib returned value '${str(value)}' for '${str(variable_name)}'`);
      // If PabotLib returns an empty value, use the default value (key doesn't exist yet)
      if (str(value) === "") {
        await BuiltIn["Log"](
          `DEBUG: PabotLib value was empty (key doesn't exist), using default value '${str(default_value)}' for '${str(variable_name)}'`
        );
        return default_value;
      }
      return value;
    }
    value = V[variable_name] ?? default_value;
    await BuiltIn["Log"](
      `DEBUG: PabotLib not available, using fallback value '${str(value)}' for '${str(variable_name)}'`
    );
    return value;

    // =============================================================================
    // SYNCHRONIZATION KEYWORDS FOR MAIL TEST
    // =============================================================================
  },

  /** Marks that the paid booking test has started execution */
  "Mark Paid Booking Test Started": async () => {
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_STARTED", "True");
    // Port: a Playwright retry starts the test again, so the failure of the previous attempt no longer counts
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_FAILED", "");
    await BuiltIn["Log"]("Marked paid booking test as started");
  },

  /** Marks that the paid booking test has completed successfully */
  "Mark Paid Booking Test Completed": async () => {
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_COMPLETED", "True");
    await BuiltIn["Log"]("Marked paid booking test as completed");
  },

  /** Marks that the paid booking test has failed */
  "Mark Paid Booking Test Failed": async () => {
    // Port: when Playwright will retry the test, the email test waits for the retry instead of skipping.
    // Robot did the same with its rerun of failed and skipped tests at the end of the run.
    // RETRYING is written before FAILED, so the email test never sees FAILED without knowing about the retry.
    const retriesLeft = testInfo().retry < testInfo().project.retries;
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_RETRYING", retriesLeft ? "True" : "");
    await parallel_test_data["Store Test Data Variable"]("PAID_BOOKING_FAILED", "True");
    await BuiltIn["Log"]("Marked paid booking test as failed");
  },

  /** Waits for the paid booking test to complete (success or failure) */
  "Wait For Paid Booking Completion": async (timeout: RobotValue = "300") => {
    let start_check_timeout: RobotValue,
      started: RobotValue,
      current_time: RobotValue,
      end_time: RobotValue,
      check_count: RobotValue,
      start_time: RobotValue,
      elapsed: RobotValue,
      booking_num: RobotValue,
      has_booking_data: RobotValue,
      elapsed_formatted: RobotValue,
      completed: RobotValue,
      failed: RobotValue,
      retrying: RobotValue;
    let retry_noticed = false;
    await BuiltIn["Log"]("Checking if paid booking test has started...");

    // Poll for up to 120 seconds to see if paid booking test starts (accounts for browser setup time)
    start_check_timeout = Date.now() / 1000 + 120;
    started = "";

    while (str(started) === "") {
      current_time = Date.now() / 1000;

      if (Number(current_time) > Number(start_check_timeout)) {
        await BuiltIn["Log"](
          "Paid booking test has not started within 120 seconds - it may not be part of this test run"
        );
        return "NOT_STARTED";
      }

      started = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_STARTED", "");
      await BuiltIn["Log"](`DEBUG: PAID_BOOKING_STARTED value: '${str(started)}'`);

      if (str(started) === "") {
        await BuiltIn["Sleep"]("0.5s");
      }
    }

    await BuiltIn["Log"]("Paid booking test has started, now waiting for completion...");

    // Use progressive polling for completion
    end_time = Date.now() / 1000 + Number(timeout);
    check_count = "0";
    start_time = Date.now() / 1000;

    while (true) {
      current_time = Date.now() / 1000;
      elapsed = Number(current_time) - Number(start_time);
      check_count = Number(check_count) + 1;

      if (Number(current_time) > Number(end_time)) {
        await BuiltIn["Log"](`Timeout after ${str(check_count)} checks`);
        return "TIMEOUT";
      }

      // Check for successful completion (BOOKING_NUM_FOR_MAIL is set)
      booking_num = await parallel_test_data["Get Test Data Variable"]("BOOKING_NUM_FOR_MAIL", "");
      has_booking_data = await BuiltIn["Run Keyword And Return Status"](BuiltIn["Should Not Be Empty"], booking_num);

      if (isTruthy(has_booking_data)) {
        elapsed_formatted = Number(elapsed).toFixed(1);
        await BuiltIn["Log"](
          `Test completed successfully after ${str(check_count)} checks (${str(elapsed_formatted)}s)`
        );
        return "COMPLETED";
      }

      // Check if test has explicitly marked completion (even if failed)
      completed = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_COMPLETED", "");
      failed = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_FAILED", "");
      retrying = await parallel_test_data["Get Test Data Variable"]("PAID_BOOKING_RETRYING", "");

      if (str(completed) === "True") {
        elapsed_formatted = Number(elapsed).toFixed(1);
        await BuiltIn["Log"](`Test marked as completed after ${str(check_count)} checks (${str(elapsed_formatted)}s)`);
        return "COMPLETED";
      } else if (str(failed) === "True" && str(retrying) === "True") {
        // Port: the failed attempt will be retried. Its start clears PAID_BOOKING_FAILED, and a failure
        // of the last attempt clears PAID_BOOKING_RETRYING. Wait for the retry with a fresh timeout.
        if (!retry_noticed) {
          retry_noticed = true;
          end_time = Date.now() / 1000 + Number(timeout);
          await BuiltIn["Log"]("Paid booking test failed and will be retried, waiting for the retry");
        }
      } else if (str(failed) === "True") {
        elapsed_formatted = Number(elapsed).toFixed(1);
        await BuiltIn["Log"](`Test failed after ${str(check_count)} checks (${str(elapsed_formatted)}s)`);
        return "FAILED";
      }

      await BuiltIn["Sleep"]("1s"); // Check every second
    }
  },
});
