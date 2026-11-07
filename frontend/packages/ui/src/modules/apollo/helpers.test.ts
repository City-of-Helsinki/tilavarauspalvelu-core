// @vitest-environment node
import type { IncomingMessage } from "node:http";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SERVER_MUTATION_TIMEOUT_MS, SERVER_QUERY_TIMEOUT_MS } from "../const";
import { enchancedFetch } from "./helpers";

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
