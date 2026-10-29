/** Port of Resources/devices.robot */
import type { BrowserContextOptions } from "@playwright/test";
import { step, log } from "../../lib/runtime";
import type { BrowserName } from "../../lib/session";
import { PageObject } from "../page-object";
import { WAF_BYPASS_SECRET } from "./env_loader";

export const BROWSER: BrowserName = "chromium";
export const BROWSER_FOR_MAIL: BrowserName = "firefox";
export const LOCALE = "en-US";
export const ENABLE_WAF_BYPASS_HEADER: boolean = true;
export const WAF_BYPASS_HEADER_NAME = "X-Test-Secret";

export class Devices extends PageObject {
  /** Adds WAF bypass headers to context config when enabled */
  @step("devices.Apply Global Header To Context Config")
  async applyGlobalHeaderToContextConfig(context_config: BrowserContextOptions) {
    if (ENABLE_WAF_BYPASS_HEADER) {
      if (WAF_BYPASS_SECRET !== "") {
        context_config.extraHTTPHeaders = { [WAF_BYPASS_HEADER_NAME]: WAF_BYPASS_SECRET };
        await log("🛡️ Added global WAF bypass header to browser context config");
      } else {
        await log("ENABLE_WAF_BYPASS_HEADER is True but WAF_BYPASS_SECRET not found in .env file", { level: "WARN" });
      }
    }
  }

  /** Sets up Chromium desktop browser */
  @step("devices.Set Up Chromium Desktop Browser And Open Url")
  // oxlint-disable-next-line eslint/no-unused-vars -- downloads are saved into the test's results folder
  async setUpChromiumDesktopBrowserAndOpenUrl(input_URL: string, DOWNLOAD_DIR: string) {
    // Port: the browser, context and page come from the project's `use` options in playwright.config.ts
    // (Chromium, 1440x900, locale, time zone), so traces, screenshots, video and --headed/--ui work. Playwright
    // starts one browser per worker; the staggered start of each slot's first test is the staggeredStart fixture
    // (TestSuites/fixtures.ts). A second call in a test opens a new context.
    const context_config: BrowserContextOptions = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({ contextOptions: context_config });
    // Go To waits for the page to load
    await this.page.goto(input_URL);

    await this.logCurrentTime();
    await log("🎉 BROWSER SETUP COMPLETED");
  }

  /** Sets up Firefox browser for permission tests - separate session from Django admin and Admin UI */
  @step("devices.Set Up Firefox Desktop Browser And Open Url")
  // oxlint-disable-next-line eslint/no-unused-vars -- downloads are saved into the test's results folder
  async setUpFirefoxDesktopBrowserAndOpenUrl(input_URL: string, DOWNLOAD_DIR: string) {
    // DEVNOTE: This is used for permission tests
    // Port: a Firefox context with the project's `use` options in playwright.config.ts, see Set Up Chromium Desktop
    // Browser And Open Url. Firefox is closed when the test ends.
    const context_config: BrowserContextOptions = {};
    await this.applyGlobalHeaderToContextConfig(context_config);
    await this.session.openPage({
      browserName: BROWSER_FOR_MAIL,
      contextOptions: context_config,
    });
    await log(`🌐 Navigating to: ${input_URL}`);
    // Go To waits for the page to load
    await this.page.goto(input_URL);
    await log("✅ Page loaded successfully");

    await this.logCurrentTime();
    await log("🎉 BROWSER SETUP COMPLETED");
  }

  /** Sets up iPhone 14 simulation */
  @step("devices.Set Up Iphone 14 And Open Url")
  async setUpIphone14AndOpenUrl(input_URL: string) {
    // Port: WebKit with the iPhone 14 device (390x664) comes from the project's `use` options in
    // playwright.config.ts, see Set Up Chromium Desktop Browser And Open Url
    const context_config: BrowserContextOptions = {};
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
    // Port: Chromium with the Pixel 5 device (393x727) comes from the project's `use` options in
    // playwright.config.ts, see Set Up Chromium Desktop Browser And Open Url
    const context_config: BrowserContextOptions = {};
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
    // Log only current local time (HH:MM:SS)
    const current_time = new Date().toTimeString().slice(0, 8);
    await log(`Current local time: ${current_time}`);
  }

  @step("devices.Log Current Cookies")
  async logCurrentCookies() {
    const fresh_cookies = (await this.page.context().cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    await log(`"🔍 cookies: ${fresh_cookies}"`);
  }
}
