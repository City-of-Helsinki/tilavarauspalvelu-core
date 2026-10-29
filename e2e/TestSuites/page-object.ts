import type { Locator, Page } from "@playwright/test";
import type { Session } from "../lib/session";
import type { Pages } from "./pages";
import type { TestState } from "./state";
import type { TestData } from "./test-data";

/**
 * The base of the page objects. Each page object holds the keywords of one module as methods marked with
 * `@step("module.Keyword Name")`, and reaches the other page objects through `this.pages`.
 */
export class PageObject {
  constructor(protected readonly pages: Pages) {}

  /** The test's pages (`lib/session.ts`). */
  protected get session(): Session {
    if (this.pages.session == null) {
      throw new Error("This test has no browser");
    }
    return this.pages.session;
  }

  /** The users and units that the test's tags chose (`TestSuites/test-data.ts`). */
  protected get testData(): TestData {
    if (this.pages.testData == null) {
      throw new Error("This test has no test data");
    }
    return this.pages.testData;
  }

  /** The values that keywords have saved while the test runs (`TestSuites/state.ts`). */
  protected get state(): TestState {
    return this.pages.state;
  }

  /** The page the keywords act on: the session's current page. */
  protected get page(): Page {
    return this.session.page;
  }

  /** A locator for a selector on the current page, or the given locator itself: some keywords take either. */
  protected locate(selector: string | Locator): Locator {
    return typeof selector === "string" ? this.page.locator(selector) : selector;
  }
}
