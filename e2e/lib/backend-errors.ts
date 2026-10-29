/**
 * Records what went wrong between the browser and the test environment while a test runs, as "backend error"
 * annotations of the test attempt: 5xx responses, failed requests, GraphQL errors, the apps' error pages ("503:
 * Palaamme pian!" is served with status 200), uncaught errors in the pages, and the requests still unanswered when a
 * failed test ends. A flaky test's report then shows whether the backend failed, and when.
 *
 * Only page loads and API calls (document, fetch, xhr) to the test environment's services are watched: the pages
 * also call production and city APIs (the service map, Linked Events) and Sentry, which the browser often can't reach
 * from the test environment. URLs are shown without their query strings, and no headers or request bodies are
 * recorded.
 */
import { setTimeout as delay } from "node:timers/promises";
import type { BrowserContext, Request, Response, TestInfo, WebError } from "@playwright/test";
import { redact } from "./runtime";

export const BACKEND_ERROR = "backend error";

/** At most this many annotations per attempt, then a count of the rest */
const MAX_ANNOTATIONS = 20;
/** A request unanswered this long when a failed test ends is reported */
const PENDING_MS = 5000;
/** How long a response body is read for, and how long the end of the test waits for the reads still going on */
const BODY_MS = 5000;

const WATCHED_TYPES = new Set(["document", "fetch", "xhr"]);
/** A request that the page or Playwright cancelled, e.g. by navigating away, isn't an error */
const ABORTED = /ERR_ABORTED|NS_BINDING_ABORTED|NS_ERROR_ABORT|cancell?ed/i;
/** The ErrorContainer heading of the apps' error pages: `error__503--title` */
const ERROR_PAGE = /data-testid="error__([^"]*?)--title"/;

/** The test environment's services (`*.test.hel.ninja`), like the apps, the backend and the login, but not Sentry */
export function isTestEnvironment(url: URL): boolean {
  return url.hostname.endsWith(".test.hel.ninja") && !url.hostname.startsWith("sentry.");
}

interface Entry {
  at: number;
  text: string;
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** The local time of day with milliseconds: 17:14:45.758 */
function clock(ms: number): string {
  const date = new Date(ms);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

/** A request as the annotations show it: `POST varaamo.test.hel.ninja/graphql/ (ConfirmReservation)` */
function describe(request: Request): string {
  const url = new URL(request.url());
  let operation = "";
  try {
    const name = (request.postDataJSON() as { operationName?: unknown } | null)?.operationName;
    operation = typeof name === "string" ? ` (${name})` : "";
  } catch {
    // Not JSON
  }
  return `${request.method()} ${url.host}${url.pathname}${operation}`;
}

/** The messages of a GraphQL response's errors, or null when it has none or the body isn't GraphQL JSON. */
function graphqlErrors(body: string): string[] | null {
  try {
    const errors = (JSON.parse(body) as { errors?: Array<{ message?: unknown }> } | null)?.errors;
    if (!Array.isArray(errors) || errors.length === 0) {
      return null;
    }
    return errors.map((error) => String(error.message ?? "").slice(0, 200));
  } catch {
    return null;
  }
}

export class BackendErrors {
  private readonly entries: Entry[] = [];
  /** The watched requests that have no answer yet, with the time they were sent */
  private readonly inFlight = new Map<Request, number>();
  /** The reads of response bodies, which the end of the test waits for */
  private readonly reads: Array<Promise<void>> = [];

  private readonly watched: (url: URL) => boolean;
  private readonly pendingMs: number;

  /** `watched` picks the hosts to watch, and `pendingMs` how long a request can go unanswered (the selftest's own). */
  constructor(
    private readonly info: Pick<TestInfo, "status" | "expectedStatus" | "annotations">,
    {
      watched = isTestEnvironment,
      pendingMs = PENDING_MS,
    }: { watched?: (url: URL) => boolean; pendingMs?: number } = {}
  ) {
    this.watched = watched;
    this.pendingMs = pendingMs;
  }

  /** Starts watching the requests and pages of a browser context. */
  watch(context: BrowserContext): void {
    context.on("request", (request) => {
      if (this.isWatched(request)) {
        this.inFlight.set(request, Date.now());
      }
    });
    context.on("requestfinished", (request) => {
      this.inFlight.delete(request);
    });
    context.on("requestfailed", (request) => {
      const sent = this.inFlight.get(request);
      if (sent == null) {
        return;
      }
      this.inFlight.delete(request);
      const failure = request.failure()?.errorText ?? "unknown error";
      if (!ABORTED.test(failure)) {
        this.add(
          Date.now(),
          `failed (${failure}) after ${((Date.now() - sent) / 1000).toFixed(1)} s: ${describe(request)}`
        );
      }
    });
    context.on("response", (response) => {
      this.checkResponse(response);
    });
    context.on("weberror", (error: WebError) => {
      const page = error.page();
      const where = page == null ? "" : ` at ${new URL(page.url()).pathname}`;
      const message = error.error().message.split("\n")[0] ?? "";
      this.add(Date.now(), `uncaught error in the page${where}: ${message.slice(0, 200)}`);
    });
  }

  /** Records the requests that are still unanswered, if the test has failed. Called before contexts close. */
  notePending(): void {
    if (this.info.status === this.info.expectedStatus) {
      return;
    }
    const now = Date.now();
    for (const [request, sent] of this.inFlight) {
      if (now - sent >= this.pendingMs) {
        this.add(sent, `no answer in ${((now - sent) / 1000).toFixed(1)} s: ${describe(request)}`);
        this.inFlight.delete(request);
      }
    }
  }

  /** Adds what was recorded to the attempt's annotations. Called when the test ends, before its contexts close. */
  async finish(): Promise<void> {
    this.notePending();
    const timer = new AbortController();
    try {
      await Promise.race([Promise.allSettled(this.reads), delay(BODY_MS, null, { signal: timer.signal })]);
    } finally {
      timer.abort();
    }
    const entries = this.entries.toSorted((a, b) => a.at - b.at);
    for (const entry of entries.slice(0, MAX_ANNOTATIONS)) {
      this.info.annotations.push({ type: BACKEND_ERROR, description: redact(`${clock(entry.at)} ${entry.text}`) });
    }
    if (entries.length > MAX_ANNOTATIONS) {
      this.info.annotations.push({
        type: BACKEND_ERROR,
        description: `… and ${entries.length - MAX_ANNOTATIONS} more`,
      });
    }
    this.entries.length = 0;
  }

  private isWatched(request: Request): boolean {
    return WATCHED_TYPES.has(request.resourceType()) && this.watched(new URL(request.url()));
  }

  private add(at: number, text: string): void {
    this.entries.push({ at, text });
  }

  private checkResponse(response: Response): void {
    const request = response.request();
    if (!this.isWatched(request)) {
      return;
    }
    const at = Date.now();
    if (response.status() >= 500) {
      this.add(at, `${response.status()} ${response.statusText()}: ${describe(request)}`);
      return;
    }
    const url = new URL(response.url());
    const isGraphql = url.pathname.endsWith("/graphql/") || url.pathname.endsWith("/graphql");
    const isPage = request.resourceType() === "document";
    if (response.status() !== 200 || (!isGraphql && !isPage)) {
      return;
    }
    const read = (async () => {
      // The body of a response from a page that is being replaced may never finish, so it is read for a limited time
      const timer = new AbortController();
      try {
        const body = await Promise.race([response.text(), delay(BODY_MS, null, { signal: timer.signal })]);
        if (body == null) {
          return;
        }
        if (isGraphql) {
          const messages = graphqlErrors(body);
          if (messages != null) {
            this.add(at, `GraphQL errors: ${describe(request)}: ${messages.join(" | ")}`);
          }
        } else {
          const errorPage = ERROR_PAGE.exec(body);
          if (errorPage != null) {
            this.add(at, `error page "${errorPage[1]}" (status ${response.status()}): ${describe(request)}`);
          }
        }
      } catch {
        // The body is gone, e.g. the page navigated or the context closed
      } finally {
        timer.abort();
      }
    })();
    this.reads.push(read);
  }
}
