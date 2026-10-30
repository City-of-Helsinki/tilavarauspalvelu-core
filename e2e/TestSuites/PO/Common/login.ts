/** Port of PO/Common/login.robot */
import { step, expect, log } from "../../../lib/runtime";
import { PageObject } from "../../page-object";
import { DJANGO_ADMIN_PASSWORD } from "../../Resources/env_loader";

export class Login extends PageObject {
  @step("login.Login Suomi Fi")
  async loginSuomiFi(input_hetu: string) {
    // Wait for Suomi.fi login button
    await this.page.locator("#social-suomi_fi").waitFor({ state: "visible", timeout: 10_000 });

    // Click Suomi.fi and wait for authentication provider selection page
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      "#social-suomi_fi",
      "#li_fakevetuma2",
      /* max_attempts= */ 2,
      /* nav_timeout= */ 15_000
    );

    // Click fakevetuma2 and wait for HETU input page
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      "#li_fakevetuma2",
      "#hetu_input",
      /* max_attempts= */ 2,
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
      /* max_attempts= */ 2,
      /* nav_timeout= */ 15_000
    );

    // Click continue to complete login
    await this.pages.customKeywords.clickAndWaitForPage("#continue-button", undefined, /* timeout= */ 15_000);
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

    // The password comes from the environment or the .env file (env_loader)
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

  @step("login.Login Suomi Fi Mobile")
  async loginSuomiFiMobile(input_hetu: string) {
    // Wait for Suomi.fi login button
    await this.page.locator("#social-suomi_fi").waitFor({ state: "visible", timeout: 15_000 });

    // Click Suomi.fi and wait for authentication provider selection page
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      "#social-suomi_fi",
      "#li_fakevetuma2",
      /* max_attempts= */ 3,
      /* nav_timeout= */ 15_000
    );

    // Click fakevetuma2 (on mobile, the one in the nav) and wait for HETU input page
    await this.pages.customKeywords.clickAndWaitForNavigationWithRetry(
      this.page.locator("nav").locator("#li_fakevetuma2"),
      "#hetu_input",
      /* max_attempts= */ 3,
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
      /* max_attempts= */ 3,
      /* nav_timeout= */ 15_000
    );

    // Click continue to complete login
    await this.pages.customKeywords.clickAndWaitForPage("#continue-button", undefined, /* timeout= */ 15_000);
  }
}
