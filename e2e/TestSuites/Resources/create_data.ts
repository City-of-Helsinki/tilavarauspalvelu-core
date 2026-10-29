import { randomBytes } from "node:crypto";
/**
 * Create robot test data for Harakka via API endpoint.
 * This is used for creating the necessary test data for test execution.
 */
import { request } from "@playwright/test";
import { setTimeout } from "node:timers/promises";
import type { APIRequestContext } from "@playwright/test";
import { RequestsLibrary } from "../../lib/RequestsLibrary";
import {
  V,
  errorMessage,
  expect,
  log,
  named,
  registerVariables,
  runStep,
  setLogLevel,
  step,
  str,
} from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/env_loader";
import "../Resources/variables";
import { PageObject } from "../page-object";

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

/**
 * Whether the site answers normally: the customer landing page renders (it isn't the error page that the customer app
 * shows when its server side rendering fails), and GraphQL answers the unit query. Logs what failed.
 */
async function siteAnswers(api: APIRequestContext): Promise<boolean> {
  try {
    // The landing page goes through the app's /csrf/ redirect, which needs the cookie that the API context keeps
    const landing = await api.get("/", { failOnStatusCode: false, timeout: 30_000 });
    if (landing.status() !== 200) {
      await log(`The landing page answered ${landing.status()}`);
      return false;
    }
    if (/data-testid="error__[^"]*--title"/.test(await landing.text())) {
      await log("The landing page is the error page");
      return false;
    }
  } catch (err) {
    await log(`The landing page didn't answer: ${errorMessage(err)}`);
    return false;
  }
  if ((await freeUnitPk()) == null) {
    await log("GraphQL didn't answer the unit query");
    return false;
  }
  return true;
}

/**
 * Waits until the site has answered normally three times in a row, 5 s apart, for at most 2 minutes. Right after the
 * test data has been saved, the backend can still fail for a while (a 502, the customer app's error page), and the
 * first tests failed on that. After 2 minutes the tests start anyway, with a warning.
 */
async function waitUntilTheSiteAnswers(): Promise<void> {
  await runStep("Wait until the site answers normally", async () => {
    // These requests need no secret headers, so none are sent
    const api = await request.newContext({ baseURL: V.BASE_URL });
    let answers_in_a_row = 0;
    try {
      await expect
        .poll(
          async () => {
            answers_in_a_row = (await siteAnswers(api)) ? answers_in_a_row + 1 : 0;
            return answers_in_a_row;
          },
          { intervals: [5000], timeout: 120_000 }
        )
        .toBeGreaterThanOrEqual(3);
      await log("The site answers normally");
    } catch {
      await log("The site didn't answer normally 3 times in a row in 2 minutes, continuing", { level: "WARN" });
    } finally {
      await api.dispose();
    }
  });
}

export class CreateData extends PageObject {
  /**
   * Calls the endpoint to Create robot test data.
   * Backend returns 204 immediately and processes data asynchronously.
   * Waits until the new data has been saved, and then until the site answers normally.
   */
  @step("create_data.Create Robot Test Data")
  async createRobotTestData() {
    let original_log_level: RobotValue,
      token: RobotValue,
      headers: RobotValue,
      endpoint: RobotValue,
      current_log_level: RobotValue,
      response: RobotValue,
      body: RobotValue;
    // [Timeout]    5 minutes
    // Temporarily suppress logging
    original_log_level = setLogLevel("NONE");

    // Retrieve token from Robot Framework variables (loaded by env_loader.py)
    // Priority: $TOKEN (if defined) > $ROBOT_API_TOKEN from env_loader.py > empty
    token = V.TOKEN ?? "";
    token = str(token) === "" ? V.ROBOT_API_TOKEN : token;

    // Create headers with token
    headers = { Authorization: token, "Content-Type": "application/json", "X-Robot-API-Secret": token };

    // Restore original log level after all sensitive operations
    setLogLevel(original_log_level);

    if (str(token) === "") {
      throw new Error("ROBOT_API_TOKEN not provided in TOKEN variable nor .env file");
    }

    // Get endpoint from Robot Framework variables or use default
    // Priority: $ENDPOINT (if defined) > $ROBOT_API_ENDPOINT from env_loader.py > DEFAULT_ENDPOINT
    endpoint = V.ENDPOINT ?? "";
    endpoint = str(endpoint) === "" ? V.ROBOT_API_ENDPOINT : endpoint;
    endpoint = str(endpoint) !== "" ? endpoint : V.DEFAULT_ENDPOINT;

    // Port: read before the call, see the wait below
    const old_pk = await freeUnitPk();

    await log("Creating robot test data");
    await log(`URL: ${V.BASE_URL}${str(endpoint)}`);

    // Create session
    await RequestsLibrary["Create Session"]("api", V.BASE_URL, named({ verify: true }));

    // Suppress logging during POST request to avoid logging sensitive headers
    current_log_level = setLogLevel("WARN");
    try {
      response = await RequestsLibrary["POST On Session"](
        "api",
        endpoint,
        named({ headers: headers, json: {}, expected_status: "any" })
      );
    } catch (err) {
      // Check if request was successful
      throw new Error(`Request failed: ${errorMessage(err)}`, { cause: err });
    } finally {
      setLogLevel(current_log_level);
    }

    await log(`Response status: ${str(response.status_code)}`);

    // Handle response
    if (Number(response.status_code) === 204) {
      await log("SUCCESS: Robot test data creation request accepted (204 No Content)");
      if (old_pk == null) {
        await log("Waiting 3 minutes for backend to complete data creation...", { level: "WARN" });
        await setTimeout(180_000); // 3 minutes for backend processing
      } else {
        // Port: waits until the new data has been saved instead of 3 minutes. The backend creates it in one
        // transaction that ends by refreshing the reservation units' availability views, and until it commits, pages
        // that need them hang or fail (502, the "503: Palaamme pian!" page). It can take longer than 3 minutes.
        await log("Waiting for backend to complete data creation...");
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
          await log("The new test data wasn't seen in 5 minutes, continuing", { level: "WARN" });
        }
      }
      await log("Backend processing wait completed");
      await waitUntilTheSiteAnswers();
      return;
    } else if (Number(response.status_code) === 400) {
      body = response.json();
      if (str(body).includes("ReservationUnitType matching query does not exist")) {
        throw new Error("PREREQUISITE DATA MISSING: Required objects don't exist in database");
      }
      throw new Error(`Bad Request: ${str(body)}`);
    } else {
      throw new Error(`Unexpected status ${str(response.status_code)}: ${str(response.text)}`);
    }
  }
}
