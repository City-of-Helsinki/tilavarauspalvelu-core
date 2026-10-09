import { ApolloError } from "@apollo/client";
import { describe, expect, test } from "vitest";
import { transformQueryError } from "./helpers";

describe("transformQueryError", () => {
  test("a timed out request is a TIMEOUT error", () => {
    const networkError = new DOMException("Request timed out after 2000 ms", "TimeoutError");
    const error = transformQueryError(new ApolloError({ networkError }));
    expect(error).toEqual({ type: "TIMEOUT", message: "Request timed out after 2000 ms" });
  });

  test("an aborted request is not a TIMEOUT error", () => {
    const networkError = new DOMException("stopped", "AbortError");
    const error = transformQueryError(new ApolloError({ networkError }));
    expect(error.type).toBe("NETWORK_ERROR");
  });
});
