/** Port of PO/Admin/admin_landingpage.robot */
import { expect, step, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { BROWSER_TIMEOUT_GLOBAL } from "../../Resources/variables";

export class AdminLandingpage extends PageObject {
  @step("admin_landingpage.Checks The Admin Landing Page H1")
  async checksTheAdminLandingPageH1(expected_H1_text: string) {
    // Port: expect retries until the heading has the text, instead of Wait Until Keyword Succeeds
    await expect(this.page.locator("H1")).toContainText(expected_H1_text, {
      timeout: BROWSER_TIMEOUT_GLOBAL,
    });
    // The top navigation renders a moment after the heading, when the user's data has loaded
    await this.page.waitForLoadState("networkidle", { timeout: 40_000 });
    await log(expected_H1_text);
  }

  @step("admin_landingpage.Approve Cookies")
  async approveCookies() {
    await this.page.locator(".ch2-btn-text-sm").click();
  }
}
