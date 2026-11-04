import { randomBytes } from "node:crypto";
/**
 * Create robot test data for Harakka via API endpoint.
 * This is used for creating the necessary test data for test execution.
 */
import { request } from "@playwright/test";
import { print } from "graphql";
import { gql } from "graphql-tag";
import { setTimeout } from "node:timers/promises";
import type { APIRequestContext } from "@playwright/test";
import type { RobotUnitQuery, RobotUnitQueryVariables } from "../../gql/gql-types";
import { readEnv } from "../../lib/env";
import { errorMessage, expect, log, runStep, step } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { ALWAYS_FREE_UNIT } from "./variables";

export const BASE_URL = "https://varaamo.test.hel.ninja";
export const MAX_RETRIES = 2;
// seconds
export const RETRY_DELAY = 60;
export const DEFAULT_ENDPOINT = "/v1/create_robot_test_data/";

const ROBOT_UNIT_QUERY = gql`
  query RobotUnit($name: String) {
    reservationUnits(nameFi: $name) {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
  }
`;

/**
 * Port: the pk of the always free unit, or null when it can't be read. The backend deletes the test data and creates
 * it again in one transaction, so a new pk means that all of the new data has been saved.
 */
async function freeUnitPk(api: APIRequestContext): Promise<number | null> {
  // Django accepts any CSRF token that is the same in the cookie and the header
  const csrf_token = randomBytes(16).toString("hex");
  try {
    const variables: RobotUnitQueryVariables = { name: ALWAYS_FREE_UNIT };
    const response = await api.post("/graphql/", {
      data: { query: print(ROBOT_UNIT_QUERY), variables },
      headers: { Cookie: `csrftoken=${csrf_token}`, "X-CSRFToken": csrf_token, Referer: `${BASE_URL}/` },
      failOnStatusCode: false,
    });
    if (response.status() !== 200) {
      return null;
    }
    const result = (await response.json()) as { data?: RobotUnitQuery };
    return (
      result.data?.reservationUnits?.edges.find((edge) => edge?.node?.nameFi === ALWAYS_FREE_UNIT)?.node?.pk ?? null
    );
  } catch {
    return null;
  }
}

/**
 * Whether a page of the customer app renders: it isn't the error page that the app shows when its server side
 * rendering fails. Logs what failed.
 */
async function pageAnswers(api: APIRequestContext, path: string, name: string): Promise<boolean> {
  try {
    // The page goes through the app's /csrf/ redirect, which needs the cookie that the API context keeps
    const response = await api.get(path, { failOnStatusCode: false, timeout: 30_000 });
    if (response.status() !== 200) {
      await log(`${name} answered ${response.status()}`);
      return false;
    }
    if (/data-testid="error__[^"]*--title"/.test(await response.text())) {
      await log(`${name} is the error page`);
      return false;
    }
  } catch (err) {
    await log(`${name} didn't answer: ${errorMessage(err)}`);
    return false;
  }
  return true;
}

/**
 * Whether the site answers normally: the customer landing page and the search page (which runs a search on the
 * server) render, and GraphQL answers the unit query. Logs what failed.
 */
async function siteAnswers(api: APIRequestContext): Promise<boolean> {
  if (!(await pageAnswers(api, "/", "The landing page")) || !(await pageAnswers(api, "/search", "The search page"))) {
    return false;
  }
  if ((await freeUnitPk(api)) == null) {
    await log("GraphQL didn't answer the unit query");
    return false;
  }
  return true;
}

/**
 * Waits until the site has answered normally three times in a row, 5 s apart, for at most 2 minutes, so that the tests
 * don't start while the backend still fails after the data creation (a 502, the customer app's error page). After
 * 2 minutes the tests start anyway, with a warning.
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
    // ROBOT_API_TOKEN and ROBOT_API_ENDPOINT come from the environment or the .env file (lib/env.ts)
    const { ROBOT_API_TOKEN: token, ROBOT_API_ENDPOINT } = readEnv();
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
