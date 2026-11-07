import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fetchWithTimeout, getOperationType, isTimeoutError } from "./fetch";

function abortReason(signal: AbortSignal | null | undefined): Error {
  return signal?.reason instanceof Error ? signal.reason : new Error("aborted");
}

/// fetch that never responds, it only rejects when the signal aborts (like the real fetch)
function hangingFetch(_url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const signal = init?.signal;
  return new Promise((_resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
    }
    signal?.addEventListener("abort", () => reject(abortReason(signal)));
  });
}

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("returns the response if the request is faster than the timeout", async () => {
    const response = new Response("ok");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(fetchWithTimeout("http://localhost", undefined, 1000)).resolves.toBe(response);
  });

  test("rejects with a TimeoutError if there is no response in time", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch));

    const settled = Promise.allSettled([fetchWithTimeout("http://localhost", undefined, 1000)]);
    await vi.advanceTimersByTimeAsync(1000);
    const [outcome] = await settled;
    expect(outcome.status).toBe("rejected");
    expect(outcome.status === "rejected" && isTimeoutError(outcome.reason)).toBe(true);
  });

  test("does not time out before the timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch));

    let isSettled = false;
    const run = async () => {
      try {
        await fetchWithTimeout("http://localhost", undefined, 1000);
      } finally {
        isSettled = true;
      }
    };
    const settled = Promise.allSettled([run()]);
    await vi.advanceTimersByTimeAsync(999);
    expect(isSettled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(isSettled).toBe(true);
    await settled;
  });

  test("the caller can still abort the request", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch));
    const controller = new AbortController();

    const settled = Promise.allSettled([fetchWithTimeout("http://localhost", { signal: controller.signal }, 1000)]);
    controller.abort(new DOMException("stopped", "AbortError"));
    const [outcome] = await settled;
    expect(outcome.status).toBe("rejected");
    expect(outcome.status === "rejected" && outcome.reason).toBeInstanceOf(DOMException);
    expect(outcome.status === "rejected" && isTimeoutError(outcome.reason)).toBe(false);
  });

  test("a signal that is already aborted stops the request", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch));
    const controller = new AbortController();
    controller.abort(new DOMException("stopped", "AbortError"));

    await expect(fetchWithTimeout("http://localhost", { signal: controller.signal }, 1000)).rejects.toThrow("stopped");
  });

  test("passes the other request options to fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWithTimeout("http://localhost", { method: "POST", body: "{}" }, 1000);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost",
      expect.objectContaining({ method: "POST", body: "{}", signal: expect.any(AbortSignal) })
    );
  });
});

describe("getOperationType", () => {
  test.each([
    ["a query", JSON.stringify({ query: "query Test { test }" }), "query"],
    ["a mutation", JSON.stringify({ query: "mutation Test { test }" }), "mutation"],
    [
      "the named operation of many",
      JSON.stringify({ query: "query A { a } mutation B { b }", operationName: "B" }),
      "mutation",
    ],
    ["a body that is not JSON", "not json", null],
    ["a query that is not valid", JSON.stringify({ query: "not graphql" }), null],
    ["form data", new FormData(), null],
  ])("returns the type of %s", (_name, body, expected) => {
    expect(getOperationType(body)).toBe(expected);
  });
});
