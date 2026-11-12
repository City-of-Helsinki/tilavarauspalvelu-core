/** Logging in: Suomi.fi with a test HETU, and Django admin with a password. */
import { readEnv } from "../../../lib/env";
import { acquireLock, releaseLock } from "../../../lib/locks";
import { step, expect, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { URL_TEST } from "../../Resources/variables";

// Tunnistus asks for an email ("Sähköpostiosoitteesi") instead of returning to Varaamo when two Suomi.fi logins finish
// at the same moment, so the workers finish their logins one at a time
const LOGIN_LOCK = "SUOMI_FI_LOGIN";

export class Login extends PageObject {
  /**
   * Clicks Suomi.fi's continue button and waits until the page is back on Varaamo, one login at a time across the
   * workers. A wait for another worker's login shows in the report.
   */
  @step("login.Click Continue One Login At A Time")
  async clickContinueOneLoginAtATime() {
    const started = Date.now();
    await acquireLock(LOGIN_LOCK);
    const waited_ms = Date.now() - started;
    // The lock is checked every 100 ms, so a shorter time means it was free
    if (waited_ms >= 100) {
      await log(`Waited ${(waited_ms / 1000).toFixed(1)} s for another worker's Suomi.fi login to finish`);
    }
    try {
      await this.pages.customKeywords.clickAndWaitForPage("#continue-button", URL_TEST, /* timeout= */ 15_000);
    } finally {
      await releaseLock(LOGIN_LOCK);
    }
  }

  @step("login.Login Suomi Fi")
  async loginSuomiFi(input_hetu: string) {
    // A phone waits longer for the button and tries each click once more. Its login page has the provider twice: the
    // one in the nav is the one shown.
    const attempts = this.isMobile ? 3 : 2;
    const provider = this.isMobile ? this.page.locator("nav").locator("#li_fakevetuma2") : "#li_fakevetuma2";

    // Wait for Suomi.fi login button
    await this.page.locator("#social-suomi_fi").waitFor({ state: "visible", timeout: this.isMobile ? 15_000 : 10_000 });

    // Click Suomi.fi and wait for authentication provider selection page
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      "#social-suomi_fi",
      "#li_fakevetuma2",
      attempts,
      /* nav_timeout= */ 15_000
    );

    // Click fakevetuma2 and wait for HETU input page
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      provider,
      "#hetu_input",
      attempts,
      /* nav_timeout= */ 15_000
    );

    // Enter HETU and submit. Typed key by key: the test identification page enables "Tunnistaudu" from key events,
    // which fill() doesn't send.
    await this.page.locator("#hetu_input").clear();
    await this.page.locator("#hetu_input").pressSequentially(input_hetu);

    // Click authenticate and wait for continue button
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      "#tunnistaudu",
      "#continue-button",
      attempts,
      /* nav_timeout= */ 15_000
    );

    // Click continue to complete login
    await this.clickContinueOneLoginAtATime();
  }

  /** The input_password argument is kept for backward compatibility but is not used */
  @step("login.Login Django Admin")
  async loginDjangoAdmin(input_username: string, input_password: string = "") {
    if (input_password !== "") {
      await log("Login Django Admin: input_password argument is ignored (using DJANGO_ADMIN_PASSWORD)", {
        level: "DEBUG",
      });
    }

    await this.page.locator("#id_username").fill(input_username);
    // Verify that the username was actually typed
    const typed_username = await this.page.locator("#id_username").inputValue();
    expect(typed_username).toEqual(input_username);

    // The password comes from the environment or the .env file (lib/env.ts)
    const { DJANGO_ADMIN_PASSWORD } = readEnv();
    await this.page.locator("#id_password").clear();
    // Typing would show the password in the report's steps, so the value is set in the page instead
    await this.page.locator("#id_password").evaluate((input, value) => {
      const field = input as HTMLInputElement;
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }, DJANGO_ADMIN_PASSWORD);
    // Verify that the password was actually typed (without logging the value)
    const typed_password = await this.page.locator("#id_password").inputValue();
    // Compared without a diff, which would show the password in the report
    expect(typed_password === DJANGO_ADMIN_PASSWORD, "The password field doesn't have the password").toBe(true);

    // Submit login form and wait for password field to disappear (indicates successful login)
    await this.page.locator('[type="submit"]').click();
    // The logged-in page has no password field
    await expect(
      this.page.locator("#id_password"),
      "Check that login credentials are correct and match the backend data."
    ).toBeHidden({ timeout: 60_000 });
  }
}
