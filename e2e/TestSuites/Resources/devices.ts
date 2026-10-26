/** Port of Resources/devices.robot */
import { Browser } from "../../lib/Browser";
import { BuiltIn } from "../../lib/BuiltIn";
import { Collections } from "../../lib/Collections";
import { DateTime } from "../../lib/DateTime";
import { PabotLib } from "../../lib/PabotLib";
import {
  V,
  errorMessage,
  isTruthy,
  keywords,
  named,
  pyBool,
  registerVariables,
  rethrowSkip,
  robot,
  str,
} from "../../lib/robot";
import type { RobotValue } from "../../lib/robot";
import { har_recording } from "../Resources/har_recording";
import "../Resources/variables";

export const devices_variables = {
  BROWSER: "chromium",
  BROWSER_FOR_MAIL: "firefox",
  LOCALE: "en-US",
  ENABLE_FIRST_NAV_GATE: true,
  ENABLE_WAF_BYPASS_HEADER: true,
  WAF_BYPASS_HEADER_NAME: "X-Test-Secret",
};
registerVariables(devices_variables);

export const devices = keywords("devices", {
  /** Only one worker performs the initial open + CSRF bootstrap; others wait briefly. */
  "Gate First Navigation With PabotLib": async (input_URL: RobotValue) => {
    let enabled: RobotValue,
      done: RobotValue,
      jitter: RobotValue,
      done2: RobotValue,
      did_nav: RobotValue,
      post_nav_sleep: RobotValue;
    enabled = V.ENABLE_FIRST_NAV_GATE ?? true;
    if (!isTruthy(enabled)) {
      return false;
    }

    done = await PabotLib["Get Parallel Value For Key"]("FIRST_NAV_DONE");
    if (str(done) === "true") {
      jitter = 0.8 + Math.random() * (1.6 - 0.8);
      await BuiltIn["Sleep"](`${str(jitter)}s`);
      return false;
    }

    await PabotLib["Acquire Lock"]("FIRST_NAV_BOOTSTRAP");
    done2 = await PabotLib["Get Parallel Value For Key"]("FIRST_NAV_DONE");
    did_nav = false;
    if (str(done2) !== "true") {
      await BuiltIn["Log"]("🌐 Gated first navigation by this worker");
      await Browser["Go To"](input_URL);
      await Browser["Wait For Load State"]("networkidle", named({ timeout: "45s" }));
      post_nav_sleep = 0.6 + Math.random() * (0.9 - 0.6);
      await BuiltIn["Sleep"](`${str(post_nav_sleep)}s`);
      await PabotLib["Set Parallel Value For Key"]("FIRST_NAV_DONE", "true");
      did_nav = true;
    }
    await PabotLib["Release Lock"]("FIRST_NAV_BOOTSTRAP");

    if (!isTruthy(did_nav)) {
      jitter = 0.8 + Math.random() * (1.6 - 0.8);
      await BuiltIn["Sleep"](`${str(jitter)}s`);
    }

    return did_nav;
  },

  "Check First Nav Done": async () => {
    let val: RobotValue;
    val = await PabotLib["Get Parallel Value For Key"]("FIRST_NAV_DONE");
    await BuiltIn["Should Be Equal As Strings"](val, "true");
  },

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

  /** Staggers browser startup to prevent resource conflicts in parallel execution */
  "Apply Staggered Startup Strategy": async (
    browser_type: RobotValue,
    input_URL: RobotValue,
    download_dir: RobotValue = ""
  ) => {
    let test_name: RobotValue,
      suite_name: RobotValue,
      pool_id: RobotValue,
      is_first_on_worker: RobotValue,
      worker_started: RobotValue,
      base_delay: RobotValue,
      random_offset: RobotValue,
      total_delay: RobotValue,
      formatted_delay: RobotValue,
      random_offset_fmt: RobotValue,
      random_delay: RobotValue,
      random_delay_fmt: RobotValue;
    test_name = robot.TEST_NAME ?? "unknown_test";
    suite_name = robot.SUITE_NAME ?? "unknown_suite";

    await BuiltIn["Log"](`🚀 STARTING ${str(browser_type)} SETUP`);
    await BuiltIn["Log"](`📋 Test: ${str(test_name)}`);
    await BuiltIn["Log"](`📁 Suite: ${str(suite_name)}`);
    await BuiltIn["Log"](`🌐 URL: ${str(input_URL)}`);
    if (pyBool(download_dir)) {
      await BuiltIn["Log"](`📂 Download Dir: ${str(download_dir)}`);
    }

    // Staggered startup strategy for parallel execution
    // Only the first test of each worker needs the long stagger, later tests start at different times anyway
    pool_id = robot.PABOTEXECUTIONPOOLID ?? null;
    is_first_on_worker = false;
    if (str(pool_id) !== "None") {
      worker_started = await PabotLib["Get Parallel Value For Key"](`WORKER_STARTED_${str(pool_id)}`);
      is_first_on_worker = !pyBool(worker_started);
    }
    if (isTruthy(is_first_on_worker)) {
      // Progressive delay: 0s, 3s, 6s, 9s, 12s, 15s, etc.
      base_delay = Number.parseInt(String(pool_id), 10) * 3;
      // Add small random component to prevent perfect synchronization
      random_offset = 1 + Math.random() * (2 - 1);
      total_delay = Number(base_delay) + Number(random_offset);
      formatted_delay = Number(total_delay).toFixed(1);
      random_offset_fmt = Number(random_offset).toFixed(1);
      await BuiltIn["Log"](
        `"⏱️ Worker ${str(pool_id)}: Staggering ${str(browser_type)} startup by ${str(formatted_delay)} seconds"`
      );
      await BuiltIn["Log"](
        `"📊 Delay breakdown: Base=${str(base_delay)}s + Random=${str(random_offset_fmt)}s = Total=${str(formatted_delay)}s"`
      );
      await BuiltIn["Sleep"](`${str(total_delay)}s`);
      await PabotLib["Set Parallel Value For Key"](`WORKER_STARTED_${str(pool_id)}`, true);
      await BuiltIn["Log"](`"✅ Stagger delay completed for Worker ${str(pool_id)}"`);
    } else {
      // Single execution or a later test on the worker - small random delay to avoid system resource conflicts
      random_delay = 0.5 + Math.random() * (1.5 - 0.5);
      random_delay_fmt = Number(random_delay).toFixed(1);
      await BuiltIn["Log"](`"⏱️ Single execution: Adding ${str(random_delay_fmt)}s random delay"`);
      await BuiltIn["Sleep"](`${str(random_delay)}s`);
      await BuiltIn["Log"]('"✅ Single execution delay completed"');
    }
  },

  /** Sets up Chromium desktop browser */
  "Set Up Chromium Desktop Browser And Open Url": async (input_URL: RobotValue, DOWNLOAD_DIR: RobotValue) => {
    let chrome_args: RobotValue,
      browserId: RobotValue,
      context_config: RobotValue,
      contextId: RobotValue,
      pageDetails: RobotValue,
      fresh_cookies: RobotValue,
      did_nav: RobotValue,
      cookies_after: RobotValue;
    await devices["Apply Staggered Startup Strategy"]("CHROMIUM DESKTOP", input_URL, DOWNLOAD_DIR);

    chrome_args = [
      "--no-default-browser-check", // Disables default browser check dialog
      "--disable-background-timer-throttling", // Prevents throttling of timer tasks from background pages
      "--disable-renderer-backgrounding", // Prevents renderer process backgrounding
      "--disable-backgrounding-occluded-windows", // Disables backgrounding renders for occluded windows
      "--password-store=basic", // Uses basic password storage backend (CI/headless)
      "--use-mock-keychain", // Uses mock keychain (CI/headless)
      "--disable-component-extensions-with-background-pages", // Disables default component extensions
      "--no-sandbox", // Required for Docker/CI environments
      "--disable-dev-shm-usage", // Required for Docker with small /dev/shm
      "--disable-translate", // Disables translate functionality
      "--disable-popup-blocking", // Disables pop-up blocking
      "--disable-prompt-on-repost", // Disables prompt when navigating to POST result pages
      "--disable-hang-monitor", // Suppresses hang monitor dialogs in renderer processes
    ];

    await BuiltIn["Log"](`🔧 Chrome Arguments: ${str(chrome_args)}`);
    await BuiltIn["Log"](`🌍 Locale: ${str(V.LOCALE)}`);

    await BuiltIn["Log"]("🔄 Creating new browser...");
    browserId = await Browser["New Browser"](
      named({ browser: V.BROWSER, headless: "true", devtools: "false", args: chrome_args, reuse_existing: "False" })
    );

    // Create context with optional HAR recording (controlled by ENABLE_HAR_RECORDING variable)
    context_config = {
      viewport: "{'width': 1440, 'height': 900}",
      acceptDownloads: "True",
      locale: V.LOCALE,
      timezoneId: "Europe/Helsinki",
      ignoreHTTPSErrors: "true",
      deviceScaleFactor: "1",
    };

    await devices["Apply Global Header To Context Config"](context_config);
    contextId = await har_recording["Create Context With Optional HAR"](context_config, "CHROMIUM");

    pageDetails = await Browser["New Page"]();

    await BuiltIn["Log"](`🆔 Browser ID: ${str(browserId)}`);
    await BuiltIn["Log"](`🆔 Context ID: ${str(contextId)}`);
    await BuiltIn["Log"](`📄 Page Details: ${str(pageDetails)}`);

    // Check for cookies before navigation to verify clean state
    fresh_cookies = await Browser["Get Cookies"](named({ return_type: "string" }));
    await BuiltIn["Log"](`"🔍 Fresh context cookies: ${str(fresh_cookies)}"`);

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    did_nav = await devices["Gate First Navigation With PabotLib"](input_URL);
    if (!isTruthy(did_nav)) {
      await Browser["Go To"](input_URL);
      await Browser["Wait For Load State"]("load", named({ timeout: "30s" }));
    }

    cookies_after = await Browser["Get Cookies"](named({ return_type: "string" }));
    await BuiltIn["Log"](`"🍪 Post-navigation cookies: ${str(cookies_after)}"`);

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("🎉 BROWSER SETUP COMPLETED");
  },

  /** Sets up Firefox browser for permission tests - separate session from Django admin and Admin UI */
  "Set Up Firefox Desktop Browser And Open Url": async (input_URL: RobotValue, DOWNLOAD_DIR: RobotValue) => {
    let firefox_args: RobotValue, context_config: RobotValue, did_nav: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let browserId: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let contextId: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let pageDetails: RobotValue;
    // DEVNOTE: This is used for permission tests

    await devices["Apply Staggered Startup Strategy"]("FIREFOX DESKTOP", input_URL, DOWNLOAD_DIR);

    // Firefox arguments
    firefox_args = ["--no-remote"]; // Prevents Firefox from connecting to a running instance

    await BuiltIn["Log"](`🔧 Firefox Arguments: ${str(firefox_args)}`);
    await BuiltIn["Log"](`🌍 Locale: ${str(V.LOCALE)}`);

    // Create new browser and independent context for session isolation
    await BuiltIn["Log"]("🔄 Creating new Firefox browser...");
    browserId = await Browser["New Browser"](
      named({ browser: V.BROWSER_FOR_MAIL, headless: "true", args: firefox_args, reuse_existing: "False" })
    );

    await BuiltIn["Log"]("🔄 Creating independent Firefox context for session isolation...");

    context_config = {
      viewport: "{'width': 1440, 'height': 900}",
      acceptDownloads: "True",
      locale: V.LOCALE,
      timezoneId: "Europe/Helsinki",
      ignoreHTTPSErrors: "true",
    };

    await devices["Apply Global Header To Context Config"](context_config);
    contextId = await har_recording["Create Context With Optional HAR"](context_config, "FIREFOX");

    await BuiltIn["Log"]("🔄 Creating new Firefox page...");
    pageDetails = await Browser["New Page"]();

    await BuiltIn["Log"]("✅ Firefox Context Created");

    // Navigate to the test URL - this will generate HAR network activity
    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    await BuiltIn["Log"](`🌐 Navigating to: ${str(input_URL)}`);
    did_nav = await devices["Gate First Navigation With PabotLib"](input_URL);
    if (!isTruthy(did_nav)) {
      await Browser["Go To"](input_URL);
      await Browser["Wait For Load State"]("load", named({ timeout: "30s" }));
    }
    await BuiltIn["Log"]("✅ Page loaded successfully");

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("🎉 BROWSER SETUP COMPLETED");
  },

  /** Sets up iPhone 14 simulation */
  "Set Up Iphone 14 And Open Url": async (input_URL: RobotValue) => {
    let iphone: RobotValue,
      webkit_args: RobotValue,
      device_config: RobotValue,
      did_nav: RobotValue,
      viewport: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let browserId: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let contextId: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let pageDetails: RobotValue;
    iphone = await Browser["Get Device"]("iPhone 14");

    await devices["Apply Staggered Startup Strategy"]("IPHONE 14", input_URL);

    // WebKit arguments for iPhone simulation
    webkit_args = [];

    await BuiltIn["Log"](`🔧 WebKit Arguments: ${str(webkit_args)} (empty - WebKit has limited CLI support)`);
    await BuiltIn["Log"]("📱 Device: iPhone 14");
    await BuiltIn["Log"]("📺 Expected Viewport: 390x664");
    await BuiltIn["Log"](`🌍 Locale: ${str(V.LOCALE)}`);

    await BuiltIn["Log"]("🔄 Creating new WebKit browser...");
    browserId = await Browser["New Browser"](
      named({ browser: "webkit", headless: "true", args: webkit_args, reuse_existing: "False" })
    );

    await BuiltIn["Log"]("🔄 Creating independent iPhone context for session isolation...");

    // Create context with optional HAR recording (controlled by ENABLE_HAR_RECORDING variable)
    device_config = { isMobile: "true", locale: V.LOCALE, ignoreHTTPSErrors: "true", deviceScaleFactor: "1" };
    // Merge iPhone device properties into config
    await Collections["Set To Dictionary"](device_config, named(iphone));

    await devices["Apply Global Header To Context Config"](device_config);
    contextId = await har_recording["Create Context With Optional HAR"](device_config, "IPHONE_14");

    await BuiltIn["Log"]("🔄 Creating new iPhone page...");
    pageDetails = await Browser["New Page"]();

    await BuiltIn["Log"]("✅ iPhone 14 Context Created");

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    await BuiltIn["Log"](`🌐 Navigating to: ${str(input_URL)}`);
    did_nav = await devices["Gate First Navigation With PabotLib"](input_URL);
    if (!isTruthy(did_nav)) {
      await Browser["Go To"](input_URL);
      await Browser["Wait For Load State"]("load", named({ timeout: "30s" }));
    }

    viewport = await Browser["Get Viewport Size"](); // should return { "width": 390, "height": 664 }
    await BuiltIn["Log"](`📏 Actual Viewport: ${str(viewport["width"])}x${str(viewport["height"])}`);

    await BuiltIn["Should Be Equal As Integers"](viewport["width"], "390");
    await BuiltIn["Should Be Equal As Integers"](viewport["height"], "664");
    await BuiltIn["Log"]("✅ Viewport validation passed: 390x664");

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("================================================================================");
    await BuiltIn["Log"]("🎉 IPHONE 14 SETUP COMPLETED");
    await BuiltIn["Log"]("================================================================================");
  },

  /** Sets up Android Pixel 5 simulation */
  "Set Up Android Pixel 5 And Open Url": async (input_URL: RobotValue) => {
    let pixel: RobotValue,
      chrome_args: RobotValue,
      device_config: RobotValue,
      did_nav: RobotValue,
      viewport: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let browserId: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let contextId: RobotValue;
    // oxlint-disable-next-line eslint/no-unused-vars -- assigned but not read in the Robot keyword
    let pageDetails: RobotValue;
    pixel = await Browser["Get Device"]("Pixel 5");

    await devices["Apply Staggered Startup Strategy"]("ANDROID PIXEL 5", input_URL);

    chrome_args = [
      "--no-default-browser-check", // Disables default browser check dialog
      "--disable-background-timer-throttling", // Prevents throttling of timer tasks from background pages
      "--disable-renderer-backgrounding", // Prevents renderer process backgrounding
      "--disable-backgrounding-occluded-windows", // Disables backgrounding renders for occluded windows
      "--password-store=basic", // Uses basic password storage backend (CI/headless)
      "--use-mock-keychain", // Uses mock keychain (CI/headless)
      "--disable-component-extensions-with-background-pages", // Disables default component extensions
      "--no-sandbox", // Required for Docker/CI environments
      "--disable-dev-shm-usage", // Required for Docker with small /dev/shm
      "--disable-translate", // Disables translate functionality
      "--disable-popup-blocking", // Disables pop-up blocking
      "--disable-prompt-on-repost", // Disables prompt when navigating to POST result pages
      "--disable-hang-monitor", // Suppresses hang monitor dialogs in renderer processes
    ];

    await BuiltIn["Log"](`🔧 Chrome Arguments: ${str(chrome_args)}`);
    await BuiltIn["Log"]("📱 Device: Pixel 5");
    await BuiltIn["Log"]("📺 Expected Viewport: 393x727");
    await BuiltIn["Log"](`🌍 Locale: ${str(V.LOCALE)}`);

    await BuiltIn["Log"]("🔄 Creating new Chromium browser...");
    browserId = await Browser["New Browser"](
      named({ browser: V.BROWSER, headless: "true", args: chrome_args, reuse_existing: "False" })
    );

    await BuiltIn["Log"]("🔄 Creating independent Android context for session isolation...");

    // Create context with optional HAR recording (controlled by ENABLE_HAR_RECORDING variable)
    device_config = { isMobile: "true", locale: V.LOCALE };
    // Merge Pixel device properties into config
    await Collections["Set To Dictionary"](device_config, named(pixel));

    await devices["Apply Global Header To Context Config"](device_config);
    contextId = await har_recording["Create Context With Optional HAR"](device_config, "PIXEL_5");

    await BuiltIn["Log"]("🔄 Creating new Android page...");
    pageDetails = await Browser["New Page"]();

    await BuiltIn["Log"]("✅ Android Pixel 5 Context Created");

    await Browser["Set Browser Timeout"](V.BROWSER_TIMEOUT_GLOBAL, named({ scope: "Global" }));
    await BuiltIn["Log"](`🌐 Navigating to: ${str(input_URL)}`);
    did_nav = await devices["Gate First Navigation With PabotLib"](input_URL);
    if (!isTruthy(did_nav)) {
      await Browser["Go To"](input_URL);
      await Browser["Wait For Load State"]("load", named({ timeout: "30s" }));
    }

    viewport = await Browser["Get Viewport Size"](); // returns { "width": 393, "height": 727 }
    await BuiltIn["Log"](`📏 Actual Viewport: ${str(viewport["width"])}x${str(viewport["height"])}`);

    await BuiltIn["Should Be Equal As Integers"](
      viewport["width"],
      "393",
      named({ msg: "The viewport width is not as expected." })
    );
    await BuiltIn["Should Be Equal As Integers"](
      viewport["height"],
      "727",
      named({ msg: "The viewport height is not as expected." })
    );
    await BuiltIn["Log"]("✅ Viewport validation passed: 393x727");

    await devices["Log Current Time"]();
    await BuiltIn["Log"]("================================================================================");
    await BuiltIn["Log"]("🎉 ANDROID PIXEL 5 SETUP COMPLETED");
    await BuiltIn["Log"]("================================================================================");
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
