/** GraphQL API commands for interacting with Varaamo backend */
import { step, expect, log } from "../../lib/runtime";
import { PageObject } from "../page-object";
import { URL_TEST } from "./variables";

/** The fields of a banner notification that the queries below read */
interface BannerNotificationNode {
  pk: number;
  name: string;
  state: string;
  draft: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
  target: string;
  level: string;
  messageFi: string | null;
  messageEn: string | null;
  messageSv: string | null;
}

interface BannerNotificationEdge {
  node: BannerNotificationNode;
}

interface BannerNotificationsResult {
  data: { bannerNotifications: { edges: BannerNotificationEdge[] } };
}

export class GraphqlCommands extends PageObject {
  /** Requires user to be logged in (uses existing cookies from Browser) */
  @step("graphql_commands.Make GraphQL Request")
  async makeGraphQLRequest(graphql_query: string, variables: Record<string, unknown> = {}): Promise<Response> {
    // Get CSRF token and cookies from Browser
    const cookies = await this.page.context().cookies();
    const csrf_token = cookies.find((cookie) => cookie.name === "csrftoken")?.value ?? "";
    const sessionid = cookies.find((cookie) => cookie.name === "sessionid")?.value ?? "";

    // Build request body
    const body = JSON.stringify({ query: graphql_query, variables: variables });

    // Build headers
    const origin = URL_TEST.replace(/\/+$/, "");
    const headers = {
      "Content-Type": "application/json",
      "x-csrftoken": csrf_token,
      Cookie: `csrftoken=${csrf_token}; sessionid=${sessionid}`,
      Referer: `${URL_TEST}kasittely/notifications`,
      Origin: origin,
    };

    // Make GraphQL request with Node's fetch, so that the session cookie isn't logged with the request
    return fetch(`${URL_TEST}graphql/`, { method: "POST", body, headers });
  }

  /**
   * Retrieves all banner notifications regardless of state
   * Returns all notifications (DRAFT, ACTIVE, SCHEDULED, etc.)
   */
  @step("graphql_commands.Get All Banner Notifications")
  async getAllBannerNotifications() {
    // Query all notifications without filter
    // Include message fields for pattern matching
    const query =
      "query { bannerNotifications { edges { node { pk name state draft activeFrom activeUntil target level messageFi messageEn messageSv } } } }";
    const response = await this.makeGraphQLRequest(query);
    expect(response.status).toBe(200);
    return (await response.json()) as BannerNotificationsResult;
  }

  /**
   * Retrieves banner notifications filtered by state
   * Queries all notifications and filters them here
   */
  @step("graphql_commands.Get Filtered Banner Notifications")
  async getFilteredBannerNotifications(...states: string[]) {
    const response_json = await this.getAllBannerNotifications();
    const all_notifications = response_json.data.bannerNotifications.edges;

    // Filter notifications by state
    return all_notifications.filter((edge) => states.includes(edge.node.state));
  }

  /**
   * Sets ALL banner notifications to DRAFT state
   * Requires user to be logged in as admin
   */
  @step("graphql_commands.Draft All Banner Notifications")
  async draftAllBannerNotifications() {
    await log("Drafting all banner notifications...", { console: true });
    const notifications = await this.getFilteredBannerNotifications("DRAFT", "ACTIVE", "SCHEDULED");
    const notification_count = notifications.length;

    // Counter for drafted notifications
    let drafted_count = 0;

    // Loop through each notification and set to draft
    for (const { node } of notifications) {
      const { pk, name, state: current_state } = node;

      await log(`Processing notification ${pk}: "${name}" (${current_state})`, { level: "DEBUG" });

      // Only update if not already in draft
      if (current_state !== "DRAFT") {
        // Make the GraphQL mutation to set draft=true
        const mutation =
          "mutation UpdateBannerNotification($input: BannerNotificationUpdateMutationInput!) { updateBannerNotification(input: $input) { pk name } }";
        const variables = { input: { pk: pk, draft: true } };
        // oxlint-disable-next-line no-await-in-loop -- one notification at a time
        await this.makeGraphQLRequest(mutation, variables);
        drafted_count++;
        // oxlint-disable-next-line no-await-in-loop -- log lines in order
        await log(`Drafted notification ${pk}`, { level: "DEBUG" });
      }
    }

    await log(`✓ Drafted ${drafted_count} notifications (${notification_count} total)`, { console: true });
  }

  /**
   * Deletes all banner notifications that contain the specified pattern in their name or message
   * Checks name, messageFi, messageEn, and messageSv fields
   * Includes both DRAFT and ACTIVE notifications in the deletion
   * Requires user to be logged in as admin
   */
  @step("graphql_commands.Delete Notifications By Name Pattern")
  async deleteNotificationsByNamePattern(name_pattern: string) {
    await log(`Deleting notifications with pattern: "${name_pattern}"`, { console: true });
    const notifications = await this.getFilteredBannerNotifications("DRAFT", "ACTIVE");
    const notification_count = notifications.length;

    // Counter for deleted notifications
    let deleted_count = 0;

    // Loop through each notification and delete if name or message matches pattern
    for (const { node } of notifications) {
      const { pk, name } = node;

      // Check if pattern appears in name or any message field (case-insensitive)
      const pattern_upper = name_pattern.toUpperCase();
      const contains = [name, node.messageFi, node.messageEn, node.messageSv].some((text) =>
        (text ?? "").toUpperCase().includes(pattern_upper)
      );

      if (contains) {
        // oxlint-disable-next-line no-await-in-loop -- log lines in order
        await log(`Deleting: ${pk} - "${name}"`, { level: "DEBUG" });

        // Make the GraphQL mutation to delete the notification
        const mutation =
          "mutation DeleteBannerNotification($input: BannerNotificationDeleteMutationInput!) { deleteBannerNotification(input: $input) { deleted } }";
        const variables = { input: { pk: pk } };
        // oxlint-disable-next-line no-await-in-loop -- one notification at a time
        await this.makeGraphQLRequest(mutation, variables);

        deleted_count++;
      } else {
        // oxlint-disable-next-line no-await-in-loop -- log lines in order
        await log(`Skipping: ${pk} - "${name}"`, { level: "DEBUG" });
      }
    }

    await log(`✓ Deleted ${deleted_count} notifications (${notification_count} total checked)`, {
      console: true,
    });
  }
}
