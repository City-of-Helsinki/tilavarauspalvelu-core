/**
 * Create robot test data for Harakka via API endpoint.
 * This is used for creating the necessary test data for test execution.
 */
import { randomBytes } from "node:crypto";
import { BuiltIn } from "../../lib/BuiltIn";
import { RequestsLibrary } from "../../lib/RequestsLibrary";
import { V, expect, keywords, named, registerVariables, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/env_loader";
import "../Resources/variables";

export const create_data_variables = {
  BASE_URL: "https://varaamo.test.hel.ninja",
  MAX_RETRIES: "2",
  // seconds
  RETRY_DELAY: "60",
  DEFAULT_ENDPOINT: "/v1/create_robot_test_data/",
};
registerVariables(create_data_variables);

/**
 * Port: the pk of the always free unit, or null when it can't be read. The backend deletes the test data and creates
 * it again in one transaction, so a new pk means that all of the new data has been saved.
 */
async function freeUnitPk(): Promise<number | null> {
  // Django accepts any CSRF token that is the same in the cookie and the header
  const csrf_token = randomBytes(16).toString("hex");
  let response: RobotValue;
  try {
    response = await RequestsLibrary["POST"](
      `${V.BASE_URL}/graphql/`,
      named({
        json: {
          query: "query RobotUnit($name: String) { reservationUnits(nameFi: $name) { edges { node { pk nameFi } } } }",
          variables: { name: V.ALWAYS_FREE_UNIT },
        },
        headers: { Cookie: `csrftoken=${csrf_token}`, "X-CSRFToken": csrf_token, Referer: `${V.BASE_URL}/` },
        expected_status: "any",
      })
    );
  } catch {
    return null;
  }
  if (response.status_code !== 200) {
    return null;
  }
  const edges: RobotValue[] = response.json()?.data?.reservationUnits?.edges ?? [];
  return edges.find((edge) => edge.node.nameFi === V.ALWAYS_FREE_UNIT)?.node.pk ?? null;
}

export const create_data = keywords("create_data", {
  /**
   * Calls the endpoint to Create robot test data.
   * Backend returns 204 immediately and processes data asynchronously.
   * Waits until the new data has been saved.
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

    // Port: read before the call, see the wait below
    const old_pk = await freeUnitPk();

    await BuiltIn["Log"]("Creating robot test data");
    await BuiltIn["Log"](`URL: ${V.BASE_URL}${str(endpoint)}`);

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
      if (old_pk == null) {
        await BuiltIn["Log"]("Waiting 3 minutes for backend to complete data creation...", "WARN");
        await BuiltIn["Sleep"]("180s"); // 3 minutes for backend processing
      } else {
        // Port: waits until the new data has been saved instead of 3 minutes. The backend creates it in one
        // transaction that ends by refreshing the reservation units' availability views, and until it commits, pages
        // that need them hang or fail (502, the "503: Palaamme pian!" page). It can take longer than 3 minutes.
        await BuiltIn["Log"]("Waiting for backend to complete data creation...");
        try {
          await expect
            .poll(
              async () => {
                const pk = await freeUnitPk();
                return pk != null && pk !== old_pk;
              },
              { intervals: [10_000], timeout: 300_000 }
            )
            .toBe(true);
        } catch {
          await BuiltIn["Log"]("The new test data wasn't seen in 5 minutes, continuing", "WARN");
        }
      }
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
