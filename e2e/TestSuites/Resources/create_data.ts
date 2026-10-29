import { randomBytes } from "node:crypto";
/**
 * Create robot test data for Harakka via API endpoint.
 * This is used for creating the necessary test data for test execution.
 */
import { request } from "@playwright/test";
import { setTimeout } from "node:timers/promises";
import type { APIRequestContext } from "@playwright/test";
import { errorMessage, expect, log, runStep, step } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { ROBOT_API_ENDPOINT, ROBOT_API_TOKEN } from "./env_loader";
import { ALWAYS_FREE_UNIT } from "./variables";

export const BASE_URL = "https://varaamo.test.hel.ninja";
export const MAX_RETRIES = 2;
// seconds
export const RETRY_DELAY = 60;
export const DEFAULT_ENDPOINT = "/v1/create_robot_test_data/";

interface UnitQueryResult {
  data?: { reservationUnits?: { edges?: Array<{ node: { pk: number; nameFi: string } }> } };
}

/**
 * Port: the pk of the always free unit, or null when it can't be read. The backend deletes the test data and creates
 * it again in one transaction, so a new pk means that all of the new data has been saved.
 */
async function freeUnitPk(api: APIRequestContext): Promise<number | null> {
  // Django accepts any CSRF token that is the same in the cookie and the header
  const csrf_token = randomBytes(16).toString("hex");
  try {
    const response = await api.post("/graphql/", {
      data: {
        query: "query RobotUnit($name: String) { reservationUnits(nameFi: $name) { edges { node { pk nameFi } } } }",
        variables: { name: ALWAYS_FREE_UNIT },
      },
      headers: { Cookie: `csrftoken=${csrf_token}`, "X-CSRFToken": csrf_token, Referer: `${BASE_URL}/` },
      failOnStatusCode: false,
    });
    if (response.status() !== 200) {
      return null;
    }
    const result = (await response.json()) as UnitQueryResult;
    return result.data?.reservationUnits?.edges?.find((edge) => edge.node.nameFi === ALWAYS_FREE_UNIT)?.node.pk ?? null;
  } catch {
    return null;
  }
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
  if ((await freeUnitPk(api)) == null) {
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
async function waitUntilTheSiteAnswers(api: APIRequestContext): Promise<void> {
  await runStep("Wait until the site answers normally", async () => {
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
    // ROBOT_API_TOKEN comes from the environment or the .env file (env_loader)
    const token = ROBOT_API_TOKEN;
    if (token === "") {
      throw new Error("ROBOT_API_TOKEN not provided in the environment nor .env file");
    }

    // Priority: ROBOT_API_ENDPOINT from the environment or .env file > DEFAULT_ENDPOINT
    const endpoint = ROBOT_API_ENDPOINT === "" ? DEFAULT_ENDPOINT : ROBOT_API_ENDPOINT;

    // The unit query and the readiness check need no secret headers, so none are sent with them
    const api = await request.newContext({ baseURL: BASE_URL });
    try {
      // Port: read before the call, see the wait below
      const old_pk = await freeUnitPk(api);

      await log("Creating robot test data");
      await log(`URL: ${BASE_URL}${endpoint}`);

      // Sent with Node's fetch, so that the token isn't logged with the request
      let response: Response;
      try {
        response = await fetch(`${BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json", "X-Robot-API-Secret": token },
          body: "{}",
        });
      } catch (err) {
        // Check if request was successful
        throw new Error(`Request failed: ${errorMessage(err)}`, { cause: err });
      }
      const body = await response.text();

      await log(`Response status: ${response.status}`);

      // Handle response
      if (response.status === 204) {
        await log("SUCCESS: Robot test data creation request accepted (204 No Content)");
        if (old_pk == null) {
          await log("Waiting 3 minutes for backend to complete data creation...", { level: "WARN" });
          await setTimeout(180_000); // 3 minutes for backend processing
        } else {
          // Port: waits until the new data has been saved instead of 3 minutes. The backend creates it in one
          // transaction that ends by refreshing the reservation units' availability views, and until it commits,
          // pages that need them hang or fail (502, the "503: Palaamme pian!" page). It can take longer than 3 minutes.
          await log("Waiting for backend to complete data creation...");
          try {
            await expect
              .poll(
                async () => {
                  const pk = await freeUnitPk(api);
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
        await waitUntilTheSiteAnswers(api);
        return;
      } else if (response.status === 400) {
        if (body.includes("ReservationUnitType matching query does not exist")) {
          throw new Error("PREREQUISITE DATA MISSING: Required objects don't exist in database");
        }
        throw new Error(`Bad Request: ${body}`);
      } else {
        throw new Error(`Unexpected status ${response.status}: ${body}`);
      }
    } finally {
      await api.dispose();
    }
  }
}
