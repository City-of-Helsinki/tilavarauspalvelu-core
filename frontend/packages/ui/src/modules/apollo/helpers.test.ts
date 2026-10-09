import { describe, expect, test } from "vitest";
import { transformQueryError } from "./helpers";

describe("transformQueryError", () => {
  test("a timed out request is a TIMEOUT error", () => {
    const error = new DOMException("Request timed out after 2000 ms", "TimeoutError");
    expect(transformQueryError(error)).toEqual({ type: "TIMEOUT", message: "Request timed out after 2000 ms" });
  });

  test("an aborted request is not a TIMEOUT error", () => {
    const error = new DOMException("stopped", "AbortError");
    expect(transformQueryError(error).type).not.toBe("TIMEOUT");
  });
});
