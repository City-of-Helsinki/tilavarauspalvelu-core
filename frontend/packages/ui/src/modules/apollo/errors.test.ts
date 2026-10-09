import { CombinedGraphQLErrors, ServerError, ServerParseError } from "@apollo/client/errors";
import { describe, expect, test } from "vitest";
import type { GraphQLFormattedError } from "graphql";
import {
  classifyError,
  getApiErrors,
  getPermissionErrors,
  getSeriesOverlapErrors,
  getValidationErrors,
  isNotFoundError,
} from "./errors";

function graphQLErrors(...errors: GraphQLFormattedError[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({ data: null, errors });
}

function serverError(status: number, body: string): ServerError {
  return new ServerError(`Response not successful: Received status code ${status}`, {
    response: new Response(body, { status }),
    bodyText: body,
  });
}

/// The error that Node.js fetch throws when it can not connect
function nodeFetchError(code: string): TypeError {
  return new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
}

describe("classifyError", () => {
  test.each([
    ["a timeout", new DOMException("Request timed out after 2000 ms", "TimeoutError"), { kind: "timeout" }],
    ["a refused connection", nodeFetchError("ECONNREFUSED"), { kind: "connection", code: "ECONNREFUSED" }],
    ["a reset connection", nodeFetchError("ECONNRESET"), { kind: "connection", code: "ECONNRESET" }],
    [
      "a failed fetch in Chrome",
      new TypeError("Failed to fetch"),
      { kind: "connection", code: "BROWSER_FETCH_FAILED" },
    ],
    ["a failed fetch in Safari", new TypeError("Load failed"), { kind: "connection", code: "BROWSER_FETCH_FAILED" }],
    ["an invalid query", serverError(400, '{"errors":[]}'), { kind: "invalid_query", body: '{"errors":[]}' }],
    ["a CSRF failure", serverError(403, '{"code":"CSRF_FAILURE"}'), { kind: "csrf" }],
    [
      "a 403 that is not a CSRF failure",
      serverError(403, "Forbidden"),
      { kind: "http", status: 403, body: "Forbidden" },
    ],
    ["a gateway error", serverError(502, "Bad Gateway"), { kind: "http", status: 502, body: "Bad Gateway" }],
  ])("%s", (_name, error, expected) => {
    expect(classifyError(error)).toEqual(expected);
  });

  test("a response that is not JSON", () => {
    const error = new ServerParseError(new SyntaxError("Unexpected token"), {
      response: new Response("<html>", { status: 504 }),
      bodyText: "<html>",
    });
    expect(classifyError(error)).toEqual({ kind: "http", status: 504, body: "<html>" });
  });

  test("an aborted request is not a timeout", () => {
    expect(classifyError(new DOMException("stopped", "AbortError")).kind).toBe("unknown");
  });

  test("a TypeError from our own code is not a connection error", () => {
    expect(classifyError(new TypeError("x is undefined")).kind).toBe("unknown");
  });

  test("a value that is not an error", () => {
    expect(classifyError("boom")).toEqual({ kind: "unknown", message: "boom" });
  });

  test("GraphQL errors", () => {
    const error = graphQLErrors({ message: "Not found", extensions: { error_code: "NOT_FOUND" } });
    expect(classifyError(error)).toEqual({
      kind: "graphql",
      errors: [{ code: "NOT_FOUND" }],
      graphQLErrors: error.errors,
    });
  });
});

describe("getApiErrors", () => {
  test("is empty for an error that is not a GraphQL error", () => {
    expect(getApiErrors(new Error("boom"))).toEqual([]);
    expect(getApiErrors(null)).toEqual([]);
  });

  test("reads the old extension name", () => {
    expect(getApiErrors(graphQLErrors({ message: "x", extensions: { code: "NOT_FOUND" } }))).toEqual([
      { code: "NOT_FOUND" },
    ]);
  });

  test("an error without a code is UNKNOWN", () => {
    expect(getApiErrors(graphQLErrors({ message: "x" }))).toEqual([{ code: "UNKNOWN" }]);
  });

  test("maps each field error of a validation error", () => {
    const error = graphQLErrors({
      message: "Validation failed",
      extensions: {
        error_code: "MUTATION_VALIDATION_ERROR",
        errors: [
          { message: "Too long", field: "name", code: "TOO_LONG" },
          { message: "Required", field: "email", code: "" },
          "not an object",
        ],
      },
    });
    expect(getValidationErrors(error)).toEqual([
      { code: "MUTATION_VALIDATION_ERROR", message: "Too long", field: "name", validation_code: "TOO_LONG" },
      { code: "MUTATION_VALIDATION_ERROR", message: "Required", field: "email", validation_code: null },
    ]);
  });

  test("a validation error without field errors", () => {
    const error = graphQLErrors({ message: "x", extensions: { error_code: "MUTATION_VALIDATION_ERROR" } });
    expect(getValidationErrors(error)).toEqual([
      { code: "MUTATION_VALIDATION_ERROR", message: null, field: null, validation_code: null },
    ]);
  });

  test("permission errors", () => {
    const error = graphQLErrors(
      { message: "x", extensions: { error_code: "NODE_PERMISSION_DENIED" } },
      { message: "y", extensions: { error_code: "NOT_FOUND" } }
    );
    expect(getPermissionErrors(error)).toEqual([
      { code: "NODE_PERMISSION_DENIED", message: null, field: null, validation_code: null },
    ]);
    expect(isNotFoundError(error)).toBe(true);
  });

  test("series overlap errors drop the invalid intervals", () => {
    const error = graphQLErrors({
      message: "x",
      extensions: {
        error_code: "RESERVATION_SERIES_OVERLAPS",
        overlapping: [{ begin: "2026-01-01T10:00", end: "2026-01-01T11:00" }, { begin: 1 }],
      },
    });
    expect(getSeriesOverlapErrors(error)).toEqual([
      { code: "RESERVATION_SERIES_OVERLAPS", overlapping: [{ begin: "2026-01-01T10:00", end: "2026-01-01T11:00" }] },
    ]);
  });

  test("extensions with an unexpected shape do not throw", () => {
    const error = graphQLErrors({ message: "x", extensions: { error_code: 5, errors: "not a list" } });
    expect(getApiErrors(error)).toEqual([{ code: "UNKNOWN" }]);
  });
});
