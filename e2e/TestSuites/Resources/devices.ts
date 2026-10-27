/** Port of Resources/devices.robot */
import { Browser, openTestPage } from "../../lib/Browser";
import { BuiltIn } from "../../lib/BuiltIn";
import { Collections } from "../../lib/Collections";
import { DateTime } from "../../lib/DateTime";
import { V, errorMessage, isTruthy, keywords, named, registerVariables, rethrowSkip, str } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/variables";
import "../Resources/har_recording";

export const devices_variables = {
  BROWSER: "chromium",
  BROWSER_FOR_MAIL: "firefox",
  LOCALE: "en-US",
  ENABLE_WAF_BYPASS_HEADER: true,
  WAF_BYPASS_HEADER_NAME: "X-Test-Secret",
};
registerVariables(devices_variables);

export const devices = keywords("devices", {
  /** Adds WAF bypass headers to context config when enabled */
  "Apply Global Header To Context Config": async (context_config: RobotValue) => {
    let waf_header_enabled: RobotValue, original_log_level: RobotValue, waf_secret: RobotValue, headers: RobotValue;
    waf_header_enabled = V.ENABLE_WAF_BYPASS_HEADER ?? true;
    if (isTruthy(waf_header_enabled)) {
      // Suppress logging
      original_log_level = await BuiltIn["Set Log Level"]("NONE");
      waf_secret = V.WAF_BYPASS_SECRET ?? "";
      await BuiltIn["Set Log Level"](original_log_level);

      if (str(waf_secret) !== "") {
        // Re-suppress logging
        original_log_level = await BuiltIn["Set Log Level"]("NONE");
        headers = { [V.WAF_BYPASS_HEADER_NAME]: waf_secret };
        await Collections["Set To Dictionary"](context_config, named({ extraHTTPHeaders: headers }));
        await BuiltIn["Set Log Level"](original_log_level);

        await BuiltIn["Log"]("🛡️ Added global WAF bypass header to browser context config");
      } else {
        await BuiltIn["Log"]("ENABLE_WAF_BYPASS_HEADER is True but WAF_BYPASS_SECRET not found in .env file", "WARN");
      }
    }
  },

  /** Sets up Chromium desktop browser */
  // oxlint-disable-next-line eslint/no-unused-vars -- Promise To Wait For Download saves the downloads
  "Set Up Chromium Desktop Browser And Open Url": async (input_URL: RobotValue, DOWNLOAD_DIR: RobotValue) => {
    let context_config: RobotValue;
    // Port: the browser, context and page come from the project's `use` options in playwright.config.ts
    // (Chromium, 1440x900, locale, time zone), so traces, screenshots, video and --headed/--ui work. Playwright
    // starts one browser per worker, so there's no staggered startup. A second call in a test opens a new context.
    context_config = {};
    await devices["Apply Global Header To Context Config"](context_config);
    await openTestPage({ contextOptions: context_config });

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    // Go To waits for the page to load
    await Browser["Go To"](input_URL);

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("🎉 BROWSER SETUP COMPLETED");
  },

  /** Sets up Firefox browser for permission tests - separate session from Django admin and Admin UI */
  // oxlint-disable-next-line eslint/no-unused-vars -- Promise To Wait For Download saves the downloads
  "Set Up Firefox Desktop Browser And Open Url": async (input_URL: RobotValue, DOWNLOAD_DIR: RobotValue) => {
    let context_config: RobotValue;
    // DEVNOTE: This is used for permission tests
    // Port: a Firefox context with the project's `use` options in playwright.config.ts, see Set Up Chromium Desktop
    // Browser And Open Url. Firefox is closed when the test ends.
    context_config = {};
    await devices["Apply Global Header To Context Config"](context_config);
    await openTestPage({ browserName: V.BROWSER_FOR_MAIL, contextOptions: context_config });

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    await BuiltIn["Log"](`🌐 Navigating to: ${str(input_URL)}`);
    // Go To waits for the page to load
    await Browser["Go To"](input_URL);
    await BuiltIn["Log"]("✅ Page loaded successfully");

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("🎉 BROWSER SETUP COMPLETED");
  },

  /** Sets up iPhone 14 simulation */
  "Set Up Iphone 14 And Open Url": async (input_URL: RobotValue) => {
    let context_config: RobotValue;
    // Port: WebKit with the iPhone 14 device (390x664) comes from the project's `use` options in
    // playwright.config.ts, see Set Up Chromium Desktop Browser And Open Url
    context_config = {};
    await devices["Apply Global Header To Context Config"](context_config);
    await openTestPage({ contextOptions: context_config });

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    await BuiltIn["Log"](`🌐 Navigating to: ${str(input_URL)}`);
    // Go To waits for the page to load
    await Browser["Go To"](input_URL);

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("🎉 IPHONE 14 SETUP COMPLETED");
  },

  /** Sets up Android Pixel 5 simulation */
  "Set Up Android Pixel 5 And Open Url": async (input_URL: RobotValue) => {
    let context_config: RobotValue;
    // Port: Chromium with the Pixel 5 device (393x727) comes from the project's `use` options in
    // playwright.config.ts, see Set Up Chromium Desktop Browser And Open Url
    context_config = {};
    await devices["Apply Global Header To Context Config"](context_config);
    await openTestPage({ contextOptions: context_config });

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    await BuiltIn["Log"](`🌐 Navigating to: ${str(input_URL)}`);
    // Go To waits for the page to load
    await Browser["Go To"](input_URL);

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("🎉 ANDROID PIXEL 5 SETUP COMPLETED");
  },

  "Log Current Time": async () => {
    let now_ts: RobotValue, current_time: RobotValue;
    // Log only current local time (HH:MM:SS)
    now_ts = await DateTime["Get Current Date"]();
    current_time = await DateTime["Convert Date"](now_ts, named({ result_format: "%H:%M:%S" }));
    await BuiltIn["Log"](`Current local time: ${str(current_time)}`);
  },

  "Log Current Cookies": async () => {
    let fresh_cookies: RobotValue;
    fresh_cookies = await Browser["Get Cookies"](named({ return_type: "string" }));
    await BuiltIn["Log"](`"🔍 cookies: ${str(fresh_cookies)}"`);
  },

  /** Properly closes browser and finalizes HAR recording for pabot tests */
  "Teardown Browser With HAR Finalization": async () => {
    let error: RobotValue;
    await BuiltIn["Log"]("🔄 Starting browser teardown...");

    try {
      await Browser["Close Browser"]();
      await BuiltIn["Log"]("✅ Browser closed successfully");
    } catch (err) {
      rethrowSkip(err);
      error = errorMessage(err);
      await BuiltIn["Log"](`⚠️ Error closing browser: ${str(error)}`);
    }

    await BuiltIn["Log"]("🎉 Browser teardown completed");

    // HAR recording is automatically enabled for all browser contexts
  },
});
