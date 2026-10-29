/** Port of Resources/devices.robot */
import { Collections } from "../../lib/Collections";
import { DateTime } from "../../lib/DateTime";
import { V, isTruthy, named, registerVariables, str, step, setLogLevel, log } from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import "../Resources/variables";
import type { BrowserName } from "../../lib/session";
import { PageObject } from "../page-object";

export const devices_variables = {
  BROWSER: "chromium",
  BROWSER_FOR_MAIL: "firefox",
  LOCALE: "en-US",
  ENABLE_WAF_BYPASS_HEADER: true,
  WAF_BYPASS_HEADER_NAME: "X-Test-Secret",
};
registerVariables(devices_variables);

export class Devices extends PageObject {
  /** Adds WAF bypass headers to context config when enabled */
  @step("devices.Apply Global Header To Context Config")
  async applyGlobalHeaderToContextConfig(context_config: RobotValue) {
    let waf_header_enabled: RobotValue, original_log_level: RobotValue, waf_secret: RobotValue, headers: RobotValue;
    waf_header_enabled = V.ENABLE_WAF_BYPASS_HEADER ?? true;
    if (isTruthy(waf_header_enabled)) {
      // Suppress logging
      original_log_level = setLogLevel("NONE");
      waf_secret = V.WAF_BYPASS_SECRET ?? "";
      setLogLevel(original_log_level);

      if (str(waf_secret) !== "") {
        // Re-suppress logging
        original_log_level = setLogLevel("NONE");
        headers = { [V.WAF_BYPASS_HEADER_NAME]: waf_secret };
        await Collections["Set To Dictionary"](context_config, named({ extraHTTPHeaders: headers }));
        setLogLevel(original_log_level);

        await log("🛡️ Added global WAF bypass header to browser context config");
      } else {
        await log("ENABLE_WAF_BYPASS_HEADER is True but WAF_BYPASS_SECRET not found in .env file", { level: "WARN" });
      }
    }
  }

  /** Sets up Chromium desktop browser */
  @step("devices.Set Up Chromium Desktop Browser And Open Url")
  // oxlint-disable-next-line eslint/no-unused-vars -- downloads are saved into the test's results folder
  async setUpChromiumDesktopBrowserAndOpenUrl(input_URL: RobotValue, DOWNLOAD_DIR: string) {
    let context_config: RobotValue;
    // Port: the browser, context and page come from the project's `use` options in playwright.config.ts
    // (Chromium, 1440x900, locale, time zone), so traces, screenshots, video and --headed/--ui work. Playwright
    // starts one browser per worker; the staggered start of each slot's first test is the staggeredStart fixture
    // (TestSuites/fixtures.ts). A second call in a test opens a new context.
    context_config = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({ contextOptions: context_config });
    // Go To waits for the page to load
    await this.page.goto(String(input_URL));

    await this.logCurrentTime();
    await log("🎉 BROWSER SETUP COMPLETED");
  }

  /** Sets up Firefox browser for permission tests - separate session from Django admin and Admin UI */
  @step("devices.Set Up Firefox Desktop Browser And Open Url")
  // oxlint-disable-next-line eslint/no-unused-vars -- downloads are saved into the test's results folder
  async setUpFirefoxDesktopBrowserAndOpenUrl(input_URL: RobotValue, DOWNLOAD_DIR: string) {
    let context_config: RobotValue;
    // DEVNOTE: This is used for permission tests
    // Port: a Firefox context with the project's `use` options in playwright.config.ts, see Set Up Chromium Desktop
    // Browser And Open Url. Firefox is closed when the test ends.
    context_config = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({
      browserName: V.BROWSER_FOR_MAIL as BrowserName,
      contextOptions: context_config,
    });
    await log(`🌐 Navigating to: ${str(input_URL)}`);
    // Go To waits for the page to load
    await this.page.goto(String(input_URL));
    await log("✅ Page loaded successfully");

    await this.logCurrentTime();
    await log("🎉 BROWSER SETUP COMPLETED");
  }

  /** Sets up iPhone 14 simulation */
  @step("devices.Set Up Iphone 14 And Open Url")
  async setUpIphone14AndOpenUrl(input_URL: string) {
    let context_config: RobotValue;
    // Port: WebKit with the iPhone 14 device (390x664) comes from the project's `use` options in
    // playwright.config.ts, see Set Up Chromium Desktop Browser And Open Url
    context_config = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({ contextOptions: context_config });
    await log(`🌐 Navigating to: ${input_URL}`);
    // Go To waits for the page to load
    await this.page.goto(input_URL);

    await this.logCurrentTime();
    await log("🎉 IPHONE 14 SETUP COMPLETED");
  }

  /** Sets up Android Pixel 5 simulation */
  @step("devices.Set Up Android Pixel 5 And Open Url")
  async setUpAndroidPixel5AndOpenUrl(input_URL: string) {
    let context_config: RobotValue;
    // Port: Chromium with the Pixel 5 device (393x727) comes from the project's `use` options in
    // playwright.config.ts, see Set Up Chromium Desktop Browser And Open Url
    context_config = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({ contextOptions: context_config });
    await log(`🌐 Navigating to: ${input_URL}`);
    // Go To waits for the page to load
    await this.page.goto(input_URL);

    await this.logCurrentTime();
    await log("🎉 ANDROID PIXEL 5 SETUP COMPLETED");
  }

  @step("devices.Log Current Time")
  async logCurrentTime() {
    let now_ts: RobotValue, current_time: RobotValue;
    // Log only current local time (HH:MM:SS)
    now_ts = await DateTime["Get Current Date"]();
    current_time = await DateTime["Convert Date"](now_ts, named({ result_format: "%H:%M:%S" }));
    await log(`Current local time: ${str(current_time)}`);
  }

  @step("devices.Log Current Cookies")
  async logCurrentCookies() {
    let fresh_cookies: RobotValue;
    fresh_cookies = (await this.page.context().cookies()).map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    await log(`"🔍 cookies: ${str(fresh_cookies)}"`);
  }
}
