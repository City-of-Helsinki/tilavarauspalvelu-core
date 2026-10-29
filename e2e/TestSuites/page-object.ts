import type { Locator, Page } from "@playwright/test";
import type { Session } from "../lib/session";
import type { Pages } from "./pages";

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

  /** The page the keywords act on: the session's current page. */
  protected get page(): Page {
    return this.session.page;
  }

  /** A locator for a selector on the current page, or the given locator itself: some keywords take either. */
  protected locate(selector: string | Locator): Locator {
    return typeof selector === "string" ? this.page.locator(selector) : selector;
  }
}
