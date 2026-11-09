import { expect, step } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BROWSER_TIMEOUT_GLOBAL } from "../../Resources/variables";

/** The admin UI's landing page. */
export class AdminLandingpage extends PageObject {
  @step("admin_landingpage.Checks The Admin Landing Page H1")
  async checksTheAdminLandingPageH1(expected_H1_text: string) {
    // expect retries until the heading has the text
    await expect(this.page.locator("H1")).toContainText(expected_H1_text, {
      timeout: BROWSER_TIMEOUT_GLOBAL,
    });
    // Network idle on purpose: the menu renders after the heading, and its first link (own units) comes from a later
    // query that moves the other links
    await this.page.waitForLoadState("networkidle", { timeout: 40_000 });
  }

  @step("admin_landingpage.Approve Cookies")
  async approveCookies() {
    await this.page.locator(".ch2-btn-text-sm").click();
  }
}
