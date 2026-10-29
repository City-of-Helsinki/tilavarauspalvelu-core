import { chromium, firefox, webkit } from "@playwright/test";
import type { Browser, BrowserContext, BrowserContextOptions, Page, TestInfo } from "@playwright/test";
import type { BackendErrors } from "./backend-errors";
import { harRecordingEnabled, redactHarFile, runStep } from "./runtime";

const LAUNCHERS = { chromium, firefox, webkit };

export type BrowserName = keyof typeof LAUNCHERS;

interface Opened {
  context: BrowserContext;
  // A browser the session launched itself, closed with the context
  browser: Browser | null;
  // The HAR file Playwright writes when the context closes (ENABLE_HAR_RECORDING=True)
  harPath: string | null;
}

/**
 * The pages a test has open, and the one its keywords act on (`page`). Most tests use only Playwright's own page.
 * Some open more: the permission tests open Django admin in Firefox and the admin UI in a new context, and the
 * notification tests open the customer site in a second tab. `switchTo` changes the page the keywords act on.
 */
export class Session {
  private current: Page | null = null;
  private testPageOpened = false;
  private readonly opened: Opened[] = [];

  /** `backendErrors` watches the test's own context and each context the session opens. */
  constructor(
    private readonly own: { browser: Browser; context: BrowserContext; page: Page },
    private readonly info: TestInfo,
    private readonly backendErrors: BackendErrors | null = null
  ) {
    backendErrors?.watch(own.context);
  }

  /** The page the keywords act on. */
  get page(): Page {
    if (this.current == null) {
      throw new Error('No page open: a "Set Up … And Open Url" keyword opens the test\'s page');
    }
    return this.current;
  }

  /**
   * Opens the page of a "Set Up … And Open Url" keyword, which becomes the current page. The first one in a test is
   * Playwright's own page, made with the project's `use` options. Each later one is a new context, a session of its
   * own: in the test's browser, or in a new browser of type `browserName` (Firefox for Django admin). New contexts get
   * the project's `use` options too, `contextOptions` (e.g. extraHTTPHeaders) on top.
   */
  async openPage(options: { browserName?: BrowserName; contextOptions?: BrowserContextOptions } = {}): Promise<Page> {
    const ownBrowser = this.own.browser.browserType().name() as BrowserName;
    const browserName = options.browserName ?? ownBrowser;
    const contextOptions = options.contextOptions ?? {};
    if (browserName === ownBrowser && !this.testPageOpened) {
      this.testPageOpened = true;
      if (contextOptions.extraHTTPHeaders != null) {
        await this.own.context.setExtraHTTPHeaders(contextOptions.extraHTTPHeaders);
      }
      this.current = this.own.page;
      return this.current;
    }
    // Launched with the run's launch options, so --headed applies too
    const launched = browserName === ownBrowser ? null : await LAUNCHERS[browserName].launch();
    const harPath = harRecordingEnabled() ? this.info.outputPath(`context-${this.opened.length + 1}.har`) : null;
    const context = await (launched ?? this.own.browser).newContext(
      harPath == null ? contextOptions : { ...contextOptions, recordHar: { path: harPath, content: "embed" } }
    );
    // The project's action and navigation timeouts, like Playwright's own context
    const { actionTimeout, navigationTimeout } = this.info.project.use;
    if (actionTimeout != null) {
      context.setDefaultTimeout(actionTimeout);
    }
    if (navigationTimeout != null) {
      context.setDefaultNavigationTimeout(navigationTimeout);
    }
    this.backendErrors?.watch(context);
    this.opened.push({ context, browser: launched, harPath });
    this.current = await context.newPage();
    return this.current;
  }

  /** Opens a new tab in the current page's context, which becomes the current page. */
  async newPage(): Promise<Page> {
    this.current = await this.page.context().newPage();
    return this.current;
  }

  /** The newest tab of the current page's context, e.g. one that a link opened. */
  latestPage(): Page {
    const latest = this.page.context().pages().at(-1);
    if (latest == null) {
      throw new Error("No new page to switch to");
    }
    return latest;
  }

  /** Makes `page` the page the keywords act on, and brings it to the front like a click on its tab. */
  async switchTo(page: Page): Promise<void> {
    await runStep(`Switch Page    ${page.url()}`, async () => {
      this.current = page;
      await page.bringToFront();
    });
  }

  /**
   * Closes the contexts and browsers the test opened itself, which saves their HAR files. Playwright closes its own
   * context and page.
   */
  async close(): Promise<void> {
    // Closing cancels the requests that are still going on, so a failed test's unanswered requests are noted first
    this.backendErrors?.notePending();
    // Every context is closed even if one fails, so their HAR files and traces aren't lost
    let failure: unknown = null;
    for (const entry of this.opened.splice(0)) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- one by one keeps the errors readable
        await entry.context.close();
        if (entry.harPath != null) {
          // oxlint-disable-next-line no-await-in-loop -- after its context has closed
          await redactHarFile(entry.harPath);
        }
        // oxlint-disable-next-line no-await-in-loop -- after its context has closed
        await entry.browser?.close();
      } catch (err) {
        failure ??= err;
      }
    }
    if (failure != null) {
      throw failure;
    }
  }
}
