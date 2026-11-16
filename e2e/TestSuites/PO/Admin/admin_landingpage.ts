import { expect, log, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO } from "../../Resources/texts_FI";
import { BROWSER_TIMEOUT_GLOBAL } from "../../Resources/variables";

/** What a staff page's data (`__NEXT_DATA__.props`) says about its server render */
export interface StaffRenderData {
  hasUser: boolean;
  hasHandlingVariables: boolean;
}

/**
 * Why a staff page shows the logged-out landing page. Its server render runs three queries together: the current user,
 * the handling counts and the banner notifications. If one fails, the page gets no user and no handling variables.
 * Without a session the queries succeed, so the page has handling variables.
 * e.g. { hasUser: false, hasHandlingVariables: false } is "server render failed"
 */
export function staffRenderOutcome(
  data: StaffRenderData | null
): "logged in" | "no session" | "server render failed" | "unknown" {
  if (data == null) {
    return "unknown";
  }
  if (data.hasUser) {
    return "logged in";
  }
  return data.hasHandlingVariables ? "no session" : "server render failed";
}

/** The admin UI's landing page. */
export class AdminLandingpage extends PageObject {
  @step("admin_landingpage.Checks The Admin Landing Page H1")
  async checksTheAdminLandingPageH1(expected_H1_text: string) {
    // A page that doesn't greet the admin after a login is reloaded once, if its server render failed
    let message: string | undefined;
    if (
      expected_H1_text === ADMIN_LANDING_PAGE_H1_TEXT_LOGGED_IN_WITH_USER_INFO &&
      !(await this.headingHasText(expected_H1_text, 5000))
    ) {
      message = await this.reloadIfTheServerRenderFailed();
    }
    // expect retries until the heading has the text
    await expect(this.page.locator("H1"), message).toContainText(expected_H1_text, {
      timeout: BROWSER_TIMEOUT_GLOBAL,
    });
    // Network idle on purpose: the menu's first link (own units) comes from a later query and moves the other links
    await this.page.waitForLoadState("networkidle", { timeout: 40_000 });
  }

  @step("admin_landingpage.Approve Cookies")
  async approveCookies() {
    await this.page.locator(".ch2-btn-text-sm").click();
  }

  /** Whether the heading has the text within `timeout` ms: true or false, no error */
  private async headingHasText(text: string, timeout: number): Promise<boolean> {
    try {
      await expect(this.page.locator("H1")).toContainText(text, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Reloads the page and warns if its server render failed. Returns a message for the check if there is no session. */
  private async reloadIfTheServerRenderFailed(): Promise<string | undefined> {
    const outcome = staffRenderOutcome(await this.staffRenderData());
    if (outcome === "server render failed") {
      await log("The staff page is logged out and its data shows a failed server render. Reloading the page once.", {
        level: "WARN",
      });
      await this.page.reload();
    }
    if (outcome === "no session") {
      return "The staff page is logged out and its server render worked, so the browser has no valid session";
    }
    return undefined;
  }

  /** The page's server render data, read from the script that Next.js writes in the page. Null if it can't be read. */
  private async staffRenderData(): Promise<StaffRenderData | null> {
    try {
      return await this.page.evaluate(() => {
        const json = document.querySelector("#__NEXT_DATA__")?.textContent;
        if (json == null) {
          return null;
        }
        const props = (JSON.parse(json) as { props?: { currentUser?: unknown; handlingVariables?: unknown } }).props;
        return props == null
          ? null
          : { hasUser: props.currentUser != null, hasHandlingVariables: props.handlingVariables != null };
      });
    } catch {
      return null;
    }
  }
}
