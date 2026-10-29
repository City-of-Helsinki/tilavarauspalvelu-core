/** Helpers for the network responses that keywords wait for. */
import { test } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";
import type { Response } from "@playwright/test";

/**
 * Whether a GraphQL response has errors. Its body is read for at most `timeout` ms: the body of a response from a
 * page that is being replaced may never finish, and then the test continues without it, with a warning.
 */
export async function graphqlErrorsIn(response: Response, timeout: number): Promise<boolean> {
  const timer = new AbortController();
  const unread = Symbol("unread");
  try {
    const body: unknown = await Promise.race([
      // A body that isn't JSON has no GraphQL errors
      response.json().catch(() => null),
      delay(timeout, unread, { signal: timer.signal }),
    ]);
    if (body === unread) {
      test.info().annotations.push({
        type: "warning",
        description: `The body of ${response.url()} didn't finish in ${timeout} ms, continuing without it`,
      });
      return false;
    }
    return typeof body === "object" && body != null && "errors" in body;
  } finally {
    timer.abort();
  }
}
