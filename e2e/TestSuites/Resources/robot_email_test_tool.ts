/** Port of robot_email_test_tool.py: verifies emails from the backend's robot email cache API. */
import { V, log } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";

interface CachedEmail {
  timestamp?: string;
  recipients?: string[];
  subject?: string | null;
  text_content?: string | null;
  attachments?: string[] | null;
}

export class RobotEmailTester {
  readonly api_endpoint: string;
  readonly robot_email: string;

  constructor(api_endpoint: string, robot_email: string) {
    this.api_endpoint = api_endpoint.replace(/\/+$/, "");
    this.robot_email = robot_email;
  }

  /** Emails from the backend cache, newest first. An empty list when the request fails. */
  async get_emails(recipient?: string, subject?: string): Promise<CachedEmail[]> {
    const params = new URLSearchParams();
    if (recipient != null) {
      params.set("recipient", recipient);
    }
    if (subject != null) {
      params.set("subject", subject);
    }
    try {
      await log(`Fetching emails from: ${this.api_endpoint}`);
      const query = params.size > 0 ? `?${params.toString()}` : "";
      const response = await fetch(`${this.api_endpoint}${query}`, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const emails = (await response.json()) as CachedEmail[];
      await log(`Retrieved ${emails.length} emails from cache (sorted newest-first)`);
      return emails;
    } catch (err) {
      await log(`Failed to retrieve emails from cache: ${String(err)}`, { level: "ERROR" });
      return [];
    }
  }

  /** True when an email with the reservation number contains every expected term. */
  async verify_reservation_email(
    reservation_number: string,
    expected_terms: string[],
    require_attachment = false
  ): Promise<boolean> {
    await log(`Verifying email for reservation: ${reservation_number}`);
    await log(`Expected terms: ${JSON.stringify(expected_terms)}`);
    const emails = await this.get_emails(this.robot_email);
    if (emails.length === 0) {
      await log(`No emails found for recipient: ${this.robot_email}`, { level: "ERROR" });
      return false;
    }
    const matching = emails.filter(
      (email) =>
        (email.subject ?? "").includes(reservation_number) || (email.text_content ?? "").includes(reservation_number)
    );
    if (matching.length === 0) {
      await log(`No emails found containing reservation number: ${reservation_number}`, { level: "ERROR" });
      return false;
    }
    await log(`Found ${matching.length} emails matching reservation number ${reservation_number}`);
    if (matching.length > 2) {
      await log(
        `Found ${matching.length} emails for reservation ${reservation_number} (expected 1-2). ` +
          "This might indicate duplicate emails or test data issues",
        { level: "WARN" }
      );
    }
    for (const [index, email] of matching.entries()) {
      const text = email.text_content ?? "";
      const attachments = email.attachments ?? [];
      const missing = expected_terms.filter((term) => term !== "" && !text.toLowerCase().includes(term.toLowerCase()));
      if (require_attachment && attachments.length === 0) {
        // oxlint-disable-next-line no-await-in-loop -- log lines in order
        await log(`Email [${index}] is missing required attachment`, { level: "WARN" });
        continue;
      }
      if (missing.length === 0) {
        // oxlint-disable-next-line no-await-in-loop -- log lines in order
        await log(
          `Email verification passed! (Email [${index}] from ${email.timestamp ?? ""}: ${email.subject ?? ""})`
        );
        return true;
      }
      // oxlint-disable-next-line no-await-in-loop -- log lines in order
      await log(`Email [${index}] is missing terms: ${missing.join(", ")}`, { level: "WARN" });
    }
    const sample = (matching[0]?.text_content ?? "").slice(0, 300);
    await log(
      `No email found matching all criteria. Reservation number: ${reservation_number}, ` +
        `matching emails: ${matching.length}. Sample from most recent email: ${sample}...`,
      { level: "ERROR" }
    );
    return false;
  }
}

let emailTester: RobotEmailTester | null = null;

export const robot_email_test_tool = {
  /** Verifies a reservation email. Creates the tester from ${DJANGO_ROBO_MAIL} and ${ROBOT_EMAIL} on first use. */
  verify_reservation_email: async (
    reservation_number: RobotValue,
    expected_terms: RobotValue,
    require_attachment: RobotValue = false
  ): Promise<boolean> => {
    try {
      if (emailTester == null) {
        const apiEndpoint = String(V.DJANGO_ROBO_MAIL ?? "");
        const robotEmail = String(V.ROBOT_EMAIL ?? "");
        if (apiEndpoint === "" || robotEmail === "") {
          await log("DJANGO_ROBO_MAIL and ROBOT_EMAIL must be set as variables.", { level: "ERROR" });
          return false;
        }
        emailTester = new RobotEmailTester(apiEndpoint, robotEmail);
      }
      return await emailTester.verify_reservation_email(
        String(reservation_number),
        (expected_terms as RobotValue[]).map(String),
        require_attachment === true || String(require_attachment).toLowerCase() === "true"
      );
    } catch (err) {
      await log(`Error in verify_reservation_email: ${String(err)}`, { level: "ERROR" });
      return false;
    }
  },
};
