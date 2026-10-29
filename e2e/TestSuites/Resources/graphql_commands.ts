/** GraphQL API commands for interacting with Varaamo backend */
import { Collections } from "../../lib/Collections";
import { RequestsLibrary } from "../../lib/RequestsLibrary";
import { V, isTruthy, named, str, step, expect, log } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/variables";
import { PageObject } from "../page-object";

export class GraphqlCommands extends PageObject {
  /** Requires user to be logged in (uses existing cookies from Browser) */
  @step("graphql_commands.Make GraphQL Request")
  async makeGraphQLRequest(graphql_query: RobotValue, variables: RobotValue = "{}") {
    let cookies: RobotValue,
      csrf_token: RobotValue,
      sessionid: RobotValue,
      body: RobotValue,
      origin: RobotValue,
      headers: RobotValue,
      response: RobotValue;
    // Get CSRF token and cookies from Browser
    cookies = await this.page.context().cookies();
    csrf_token = cookies.find((cookie: RobotValue) => cookie.name === "csrftoken")?.value ?? null;
    sessionid = cookies.find((cookie: RobotValue) => cookie.name === "sessionid")?.value ?? null;

    // Build request body
    body = JSON.stringify({ query: graphql_query, variables: variables });

    // Build headers
    origin = String(V.URL_TEST).replace(/\/+$/, "");
    headers = {
      "Content-Type": "application/json",
      "x-csrftoken": csrf_token,
      Cookie: `csrftoken=${str(csrf_token)}; sessionid=${str(sessionid)}`,
      Referer: `${V.URL_TEST}kasittely/notifications`,
      Origin: origin,
    };

    // Make GraphQL request using RequestsLibrary
    response = await RequestsLibrary["POST"](
      `${V.URL_TEST}graphql/`,
      named({ data: body, headers: headers, expected_status: "any" })
    );

    return response;
  }

  /**
   * Retrieves all banner notifications regardless of state
   * Returns all notifications (DRAFT, ACTIVE, SCHEDULED, etc.)
   */
  @step("graphql_commands.Get All Banner Notifications")
  async getAllBannerNotifications() {
    let query: RobotValue, response: RobotValue;
    // Query all notifications without filter
    // Include message fields for pattern matching
    query =
      "query { bannerNotifications { edges { node { pk name state draft activeFrom activeUntil target level messageFi messageEn messageSv } } } }";
    response = await this.makeGraphQLRequest(query);
    expect(str(response.status_code)).toBe("200");
    return response;
  }

  /**
   * Retrieves banner notifications filtered by state
   * Queries all notifications and filters in Robot Framework code
   */
  @step("graphql_commands.Get Filtered Banner Notifications")
  async getFilteredBannerNotifications(...states: RobotValue[]) {
    let response: RobotValue,
      response_json: RobotValue,
      all_notifications: RobotValue,
      states_list: RobotValue,
      filtered_edges: RobotValue,
      edge: RobotValue,
      node: RobotValue,
      state: RobotValue,
      state_matches: RobotValue;
    response = await this.getAllBannerNotifications();
    response_json = response.json();
    all_notifications = response_json["data"]["bannerNotifications"]["edges"];

    // Convert states varargs to list for evaluation
    states_list = [...states];

    // Filter notifications by state
    filtered_edges = [];
    for (edge of all_notifications) {
      node = edge["node"];
      state = node["state"];
      state_matches = states_list.includes(state);
      if (isTruthy(state_matches)) {
        await Collections["Append To List"](filtered_edges, edge);
      }
    }

    return filtered_edges;
  }

  /**
   * Sets ALL banner notifications to DRAFT state
   * Requires user to be logged in as admin
   */
  @step("graphql_commands.Draft All Banner Notifications")
  async draftAllBannerNotifications() {
    let notifications: RobotValue,
      notification_count: RobotValue,
      drafted_count: RobotValue,
      edge: RobotValue,
      node: RobotValue,
      pk: RobotValue,
      name: RobotValue,
      current_state: RobotValue,
      mutation: RobotValue,
      variables: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let result: RobotValue;
    await log("Drafting all banner notifications...", { console: true });
    notifications = await this.getFilteredBannerNotifications("DRAFT", "ACTIVE", "SCHEDULED");
    notification_count = notifications.length;

    // Counter for drafted notifications
    drafted_count = 0;

    // Loop through each notification and set to draft
    for (edge of notifications) {
      node = edge["node"];
      pk = node["pk"];
      name = node["name"];
      current_state = node["state"];

      await log(`Processing notification ${str(pk)}: "${str(name)}" (${str(current_state)})`, { level: "DEBUG" });

      // Only update if not already in draft
      if (str(current_state) !== "DRAFT") {
        // Make the GraphQL mutation to set draft=true
        mutation =
          "mutation UpdateBannerNotification($input: BannerNotificationUpdateMutationInput!) { updateBannerNotification(input: $input) { pk name } }";
        variables = { input: { pk: pk, draft: true } };
        result = await this.makeGraphQLRequest(mutation, variables);
        drafted_count = Number(drafted_count) + 1;
        await log(`Drafted notification ${str(pk)}`, { level: "DEBUG" });
      }
    }

    await log(`✓ Drafted ${str(drafted_count)} notifications (${str(notification_count)} total)`, { console: true });
  }

  /**
   * Deletes all banner notifications that contain the specified pattern in their name or message
   * Checks name, messageFi, messageEn, and messageSv fields
   * Includes both DRAFT and ACTIVE notifications in the deletion
   * Requires user to be logged in as admin
   */
  @step("graphql_commands.Delete Notifications By Name Pattern")
  async deleteNotificationsByNamePattern(name_pattern: string) {
    let notifications: RobotValue,
      notification_count: RobotValue,
      deleted_count: RobotValue,
      edge: RobotValue,
      node: RobotValue,
      pk: RobotValue,
      name: RobotValue,
      message_fi: RobotValue,
      message_en: RobotValue,
      message_sv: RobotValue,
      pattern_upper: RobotValue,
      name_upper: RobotValue,
      message_fi_upper: RobotValue,
      message_en_upper: RobotValue,
      message_sv_upper: RobotValue,
      in_name: RobotValue,
      in_fi: RobotValue,
      in_en: RobotValue,
      in_sv: RobotValue,
      contains: RobotValue,
      mutation: RobotValue,
      variables: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let result: RobotValue;
    await log(`Deleting notifications with pattern: "${name_pattern}"`, { console: true });
    notifications = await this.getFilteredBannerNotifications("DRAFT", "ACTIVE");
    notification_count = notifications.length;

    // Counter for deleted notifications
    deleted_count = 0;

    // Loop through each notification and delete if name or message matches pattern
    for (edge of notifications) {
      node = edge["node"];
      pk = node["pk"];
      name = node["name"];
      message_fi = await Collections["Get From Dictionary"](node, "messageFi", named({ default: "" }));
      message_en = await Collections["Get From Dictionary"](node, "messageEn", named({ default: "" }));
      message_sv = await Collections["Get From Dictionary"](node, "messageSv", named({ default: "" }));

      // Check if pattern appears in name or any message field (case-insensitive)
      pattern_upper = name_pattern.toUpperCase();
      name_upper = str(name).toUpperCase();
      message_fi_upper = str(message_fi).toUpperCase();
      message_en_upper = str(message_en).toUpperCase();
      message_sv_upper = str(message_sv).toUpperCase();

      in_name = str(name_upper).includes(str(pattern_upper));
      in_fi = str(message_fi_upper).includes(str(pattern_upper));
      in_en = str(message_en_upper).includes(str(pattern_upper));
      in_sv = str(message_sv_upper).includes(str(pattern_upper));
      contains = isTruthy(in_name) || isTruthy(in_fi) || isTruthy(in_en) || isTruthy(in_sv);

      if (isTruthy(contains)) {
        await log(`Deleting: ${str(pk)} - "${str(name)}"`, { level: "DEBUG" });

        // Make the GraphQL mutation to delete the notification
        mutation =
          "mutation DeleteBannerNotification($input: BannerNotificationDeleteMutationInput!) { deleteBannerNotification(input: $input) { deleted } }";
        variables = { input: { pk: pk } };
        result = await this.makeGraphQLRequest(mutation, variables);

        deleted_count = Number(deleted_count) + 1;
      } else {
        await log(`Skipping: ${str(pk)} - "${str(name)}"`, { level: "DEBUG" });
      }
    }

    await log(`✓ Deleted ${str(deleted_count)} notifications (${str(notification_count)} total checked)`, {
      console: true,
    });
  }
}
