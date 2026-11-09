// @vitest-environment node
import type { IncomingMessage } from "node:http";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SERVER_MUTATION_TIMEOUT_MS, SERVER_QUERY_TIMEOUT_MS } from "../const";
import type { FetchError } from "./errors";
import { enchancedFetch, getFetchErrorToast } from "./helpers";

function abortReason(signal: AbortSignal | null | undefined): Error {
  return signal?.reason instanceof Error ? signal.reason : new Error("aborted");
}

/// fetch that never responds, it only rejects when the signal aborts (like the real fetch)
function hangingFetch(_url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(abortReason(init.signal)));
  });
}

const req = {
  url: "/",
  headers: { cookie: "csrftoken=token", host: "localhost:3000" },
  socket: {},
} as unknown as IncomingMessage;

/// The time from the request to the timeout
async function measureTimeout(query: string): Promise<number> {
  const start = Date.now();
  const request = enchancedFetch(req)("http://backend.test/graphql/", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  const settled = Promise.allSettled([request]);
  await vi.runAllTimersAsync();
  const [result] = await settled;
  expect(result.status).toBe("rejected");
  return Date.now() - start;
}

describe("enchancedFetch on the server", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(hangingFetch));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("uses the query timeout for a query", async () => {
    expect(await measureTimeout("query Test { test }")).toBe(SERVER_QUERY_TIMEOUT_MS);
  });

  test("uses the mutation timeout for a mutation", async () => {
    expect(await measureTimeout("mutation Test { test }")).toBe(SERVER_MUTATION_TIMEOUT_MS);
  });
});

describe("getFetchErrorToast", () => {
  const CAN_STILL_BE_SAVED =
    "The service did not respond in time. Your change can still be saved. Refresh the page before you try again.";
  const TRY_AGAIN = "Unable to connect to the service. Please try again.";

  test.each<[string, FetchError]>([
    ["a timeout", { kind: "timeout" }],
    ["a 504 from the gateway", { kind: "http", status: 504, body: "" }],
  ])("tells the user that a mutation can still be saved after %s", (_name, error) => {
    expect(getFetchErrorToast(error, true, "en")).toEqual({ id: "mutation_timeout_error", text: CAN_STILL_BE_SAVED });
  });

  test("tells the user to try again when a mutation fails fast", () => {
    expect(getFetchErrorToast({ kind: "http", status: 502, body: "" }, true, "en")).toEqual({
      id: "network_error",
      text: `${TRY_AGAIN}: 502`,
    });
    expect(getFetchErrorToast({ kind: "connection", code: "BROWSER_FETCH_FAILED" }, true, "en")).toEqual({
      id: "network_error",
      text: TRY_AGAIN,
    });
  });

  test("tells the user to try again when a query fails with a 504 or a timeout", () => {
    expect(getFetchErrorToast({ kind: "http", status: 504, body: "" }, false, "en")).toEqual({
      id: "network_error",
      text: `${TRY_AGAIN}: 504`,
    });
    expect(getFetchErrorToast({ kind: "timeout" }, false, "en")).toEqual({ id: "network_error", text: TRY_AGAIN });
  });

  test("shows no toast for the errors that the UI handles", () => {
    expect(getFetchErrorToast({ kind: "graphql", errors: [], graphQLErrors: [] }, true, "en")).toBeNull();
    expect(getFetchErrorToast({ kind: "csrf" }, false, "en")).toBeNull();
  });
});
