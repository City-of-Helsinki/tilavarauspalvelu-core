/** Port of PO/Common/login.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, keywords, named } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/serial_users";
import "../../Resources/variables";
import "../../Resources/parallel_test_data";
import "../../Resources/texts_FI";

export const login = keywords("login", {
  "Login Suomi Fi": async (input_hetu: string) => {
    // Wait for Suomi.fi login button
    await Browser["Wait For Elements State"]("id=social-suomi_fi", "visible", named({ timeout: "10s" }));

    // Click Suomi.fi and wait for authentication provider selection page
    await custom_keywords["Click And Wait For Navigation With Retry"](
      "id=social-suomi_fi",
      "id=li_fakevetuma2",
      /* max_attempts= */ "2",
      /* nav_timeout= */ "15s"
    );

    // Click fakevetuma2 and wait for HETU input page
    await custom_keywords["Click And Wait For Navigation With Retry"](
      "css=#li_fakevetuma2",
      "css=#hetu_input",
      /* max_attempts= */ "2",
      /* nav_timeout= */ "15s"
    );

    // Enter HETU and submit
    await Browser["Type Text"]("css=#hetu_input", input_hetu);

    // Click authenticate and wait for continue button
    await custom_keywords["Click And Wait For Navigation With Retry"](
      "css=#tunnistaudu",
      "css=#continue-button",
      /* max_attempts= */ "2",
      /* nav_timeout= */ "15s"
    );

    // Click continue to complete login
    await custom_keywords["Click And Wait For Page"]("css=#continue-button", undefined, /* timeout= */ "15s");
  },

  /** The input_password argument is kept for backward compatibility but is not used */
  "Login Django Admin": async (input_username: string, input_password: string = "") => {
    let typed_username: RobotValue, original_log_level: RobotValue, typed_password: RobotValue;
    if (input_password !== "") {
      await BuiltIn["Log"](
        "Login Django Admin: input_password argument is ignored (using DJANGO_ADMIN_PASSWORD)",
        named({ level: "DEBUG" })
      );
    }

    await Browser["Type Text"]("id=id_username", input_username);
    // Verify that the username was actually typed
    typed_username = await Browser["Get Property"]("id=id_username", "value");
    await BuiltIn["Should Be Equal"](typed_username, input_username);

    // Use password from Robot Framework variable (loaded by env_loader.py)
    // Suppress logging when typing password
    original_log_level = await BuiltIn["Set Log Level"]("WARN");
    await Browser["Type Text"]("id=id_password", V.DJANGO_ADMIN_PASSWORD);
    // Verify that the password was actually typed (without logging the value)
    typed_password = await Browser["Get Property"]("id=id_password", "value");
    await BuiltIn["Should Be Equal"](typed_password, V.DJANGO_ADMIN_PASSWORD);
    await BuiltIn["Set Log Level"](original_log_level);

    // Submit login form and wait for password field to disappear (indicates successful login)
    await Browser["Click"]('[type="submit"]');
    // The logged-in page has no password field
    await Browser["Wait For Elements State"](
      "id=id_password",
      "hidden",
      named({ timeout: "60s", message: "Check that login credentials are correct and match the backend data." })
    );
  },

  "Login Suomi Fi Mobile": async (input_hetu: string) => {
    // Wait for Suomi.fi login button
    await Browser["Wait For Elements State"]("id=social-suomi_fi", "visible", named({ timeout: "15s" }));

    // Click Suomi.fi and wait for authentication provider selection page
    await custom_keywords["Click And Wait For Navigation With Retry"](
      "id=social-suomi_fi",
      "id=li_fakevetuma2",
      /* max_attempts= */ "3",
      /* nav_timeout= */ "15s"
    );

    // Click fakevetuma2 (mobile uses nav >> prefix) and wait for HETU input page
    await custom_keywords["Click And Wait For Navigation With Retry"](
      "nav >> id=li_fakevetuma2",
      "css=#hetu_input",
      /* max_attempts= */ "3",
      /* nav_timeout= */ "15s"
    );

    // Enter HETU and submit
    await Browser["Type Text"]("css=#hetu_input", input_hetu);

    // Click authenticate and wait for continue button
    await custom_keywords["Click And Wait For Navigation With Retry"](
      "css=#tunnistaudu",
      "css=#continue-button",
      /* max_attempts= */ "3",
      /* nav_timeout= */ "15s"
    );

    // Click continue to complete login
    await custom_keywords["Click And Wait For Page"]("css=#continue-button", undefined, /* timeout= */ "15s");
  },
});
