/**
 * Create robot test data for Harakka via API endpoint.
 * This is used for creating the necessary test data for test execution.
 */
import { BuiltIn } from "../../lib/BuiltIn";
import { RequestsLibrary } from "../../lib/RequestsLibrary";
import { V, keywords, named, registerVariables, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/env_loader";

export const create_data_variables = {
  BASE_URL: "https://varaamo.test.hel.ninja",
  MAX_RETRIES: "2",
  // seconds
  RETRY_DELAY: "60",
  DEFAULT_ENDPOINT: "/v1/create_robot_test_data/",
};
registerVariables(create_data_variables);

export const create_data = keywords("create_data", {
  "Create Robot Test Data DISABLED": async () => {
    await BuiltIn["Log"]("Disabled until backend data creation is ready");
  },

  /**
   * Calls the endpoint to Create robot test data.
   * Backend returns 204 immediately and processes data asynchronously.
   * Waits 3 minutes for backend processing to complete.
   */
  "Create Robot Test Data": async () => {
    let original_log_level: RobotValue,
      token: RobotValue,
      headers: RobotValue,
      endpoint: RobotValue,
      current_log_level: RobotValue,
      status: RobotValue,
      response: RobotValue,
      body: RobotValue;
    // [Timeout]    5 minutes
    // Temporarily suppress logging
    original_log_level = await BuiltIn["Set Log Level"]("NONE");

    // Retrieve token from Robot Framework variables (loaded by env_loader.py)
    // Priority: $TOKEN (if defined) > $ROBOT_API_TOKEN from env_loader.py > empty
    token = V.TOKEN ?? "";
    token = str(token) === "" ? V.ROBOT_API_TOKEN : token;

    // Create headers with token
    headers = { Authorization: token, "Content-Type": "application/json", "X-Robot-API-Secret": token };

    // Restore original log level after all sensitive operations
    await BuiltIn["Set Log Level"](original_log_level);

    if (str(token) === "") {
      await BuiltIn["Fail"]("ROBOT_API_TOKEN not provided in TOKEN variable nor .env file");
    }

    // Get endpoint from Robot Framework variables or use default
    // Priority: $ENDPOINT (if defined) > $ROBOT_API_ENDPOINT from env_loader.py > DEFAULT_ENDPOINT
    endpoint = V.ENDPOINT ?? "";
    endpoint = str(endpoint) === "" ? V.ROBOT_API_ENDPOINT : endpoint;
    endpoint = str(endpoint) !== "" ? endpoint : V.DEFAULT_ENDPOINT;

    await BuiltIn["Log"]("Creating robot test data");
    await BuiltIn["Log"](`URL: ${str(V.BASE_URL)}${str(endpoint)}`);

    // Create session
    await RequestsLibrary["Create Session"]("api", V.BASE_URL, named({ verify: true }));

    // Suppress logging during POST request to avoid logging sensitive headers
    current_log_level = await BuiltIn["Set Log Level"]("WARN");
    [status, response] = await BuiltIn["Run Keyword And Ignore Error"](
      RequestsLibrary["POST On Session"],
      "api",
      endpoint,
      named({ headers: headers, json: {}, expected_status: "any" })
    );
    await BuiltIn["Set Log Level"](current_log_level);

    // Check if request was successful
    if (str(status) !== "PASS") {
      await BuiltIn["Fail"](`Request failed: ${str(response)}`);
    }

    await BuiltIn["Log"](`Response status: ${str(response.status_code)}`);

    // Handle response
    if (Number(response.status_code) === 204) {
      await BuiltIn["Log"]("SUCCESS: Robot test data creation request accepted (204 No Content)");
      await BuiltIn["Log"]("Waiting 3 minutes for backend to complete data creation...", "WARN");
      await BuiltIn["Sleep"]("180s"); // 3 minutes for backend processing
      await BuiltIn["Log"]("Backend processing wait completed");
      return;
    } else if (Number(response.status_code) === 400) {
      body = response.json();
      if (str(body).includes("ReservationUnitType matching query does not exist")) {
        await BuiltIn["Fail"]("PREREQUISITE DATA MISSING: Required objects don't exist in database");
      }
      await BuiltIn["Fail"](`Bad Request: ${str(body)}`);
    } else {
      await BuiltIn["Fail"](`Unexpected status ${str(response.status_code)}: ${str(response.text)}`);
    }
  },
});
