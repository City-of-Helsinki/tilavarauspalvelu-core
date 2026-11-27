import { ApolloLink, Observable, execute, gql } from "@apollo/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { FetchResult } from "@apollo/client";
import { errorLink } from "./helpers";
import type { ExpectedErrorContext } from "./helpers";

const mockCaptureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({ captureMessage: (...args: unknown[]) => mockCaptureMessage(...args) }));

const QUERY = gql`
  query FilterOptions {
    unitGroups {
      edges {
        node {
          id
        }
      }
    }
  }
`;

function createErrorResult(errorCode: string): FetchResult {
  return {
    data: null,
    errors: [{ message: "Denied", path: ["unitGroups"], extensions: { error_code: errorCode } }],
  };
}

/// Runs the query through the error link. The last link gives the result, instead of a request to the backend.
function runQuery(result: FetchResult, context?: ExpectedErrorContext): Promise<void> {
  const resultLink = new ApolloLink(() => Observable.of(result));
  const link = ApolloLink.from([errorLink, resultLink]);
  return new Promise((resolve) => {
    execute(link, { query: QUERY, context }).subscribe({ complete: resolve, error: () => resolve() });
  });
}

describe("errorLink", () => {
  beforeEach(() => {
    mockCaptureMessage.mockClear();
  });

  test("sends a permission error to Sentry", async () => {
    await runQuery(createErrorResult("FILTER_PERMISSION_DENIED"));

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage.mock.calls[0]?.[0]).toBe("GraphQL error: FilterOptions FILTER_PERMISSION_DENIED");
  });

  test("does not send an error code that the query context expects", async () => {
    await runQuery(createErrorResult("FILTER_PERMISSION_DENIED"), {
      expectedErrorCodes: ["FILTER_PERMISSION_DENIED"],
    });

    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  test("sends an error code that the query context does not expect", async () => {
    await runQuery(createErrorResult("NODE_PERMISSION_DENIED"), {
      expectedErrorCodes: ["FILTER_PERMISSION_DENIED"],
    });

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage.mock.calls[0]?.[0]).toBe("GraphQL error: FilterOptions NODE_PERMISSION_DENIED");
  });
});
