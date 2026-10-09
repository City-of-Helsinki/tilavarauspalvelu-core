import { ApolloClient, ApolloLink, InMemoryCache, gql } from "@apollo/client";
import { ServerError } from "@apollo/client/errors";
import { of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createRetryLink } from "./retryLink";

const QUERY = gql`
  query Test {
    test
  }
`;

const MUTATION = gql`
  mutation Test {
    test
  }
`;

/// The error that Node.js fetch throws when it can not connect
function connectionError(): TypeError {
  return new TypeError("fetch failed", { cause: Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" }) });
}

function serverError(status: number): ServerError {
  return new ServerError(`Received status code ${status}`, { response: new Response("", { status }), bodyText: "" });
}

/// A client whose backend fails with the errors in order, and then returns data
function createClient(isServer: boolean, errors: Error[]) {
  let calls = 0;
  const backend = new ApolloLink(() => {
    const error = errors[calls];
    calls += 1;
    return error != null ? throwError(() => error) : of({ data: { test: "ok" } });
  });
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([createRetryLink(isServer), backend]),
  });
  return { client, getCalls: () => calls };
}

/// Run the request and let the retry delays pass
async function run<T>(request: Promise<T>): Promise<PromiseSettledResult<T>> {
  const settled = Promise.allSettled([request]);
  await vi.runAllTimersAsync();
  const [result] = await settled;
  return result;
}

describe("createRetryLink", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("retries a query that could not connect", async () => {
    const { client, getCalls } = createClient(false, [connectionError(), connectionError()]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("fulfilled");
    expect(getCalls()).toBe(3);
  });

  test.each([502, 503, 504])("retries a query that failed with %i", async (status) => {
    const { client, getCalls } = createClient(false, [serverError(status)]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("fulfilled");
    expect(getCalls()).toBe(2);
  });

  test("stops after 3 attempts in the browser", async () => {
    const { client, getCalls } = createClient(false, [connectionError(), connectionError(), connectionError()]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("rejected");
    expect(getCalls()).toBe(3);
  });

  test("stops after 2 attempts on the server", async () => {
    const { client, getCalls } = createClient(true, [connectionError(), connectionError()]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("rejected");
    expect(getCalls()).toBe(2);
  });

  test("retries a timeout on the server", async () => {
    const timeout = new DOMException("Request timed out", "TimeoutError");
    const { client, getCalls } = createClient(true, [timeout]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("fulfilled");
    expect(getCalls()).toBe(2);
  });

  test("does not retry a timeout in the browser", async () => {
    const timeout = new DOMException("Request timed out", "TimeoutError");
    const { client, getCalls } = createClient(false, [timeout]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("rejected");
    expect(getCalls()).toBe(1);
  });

  test("never retries a mutation", async () => {
    const { client, getCalls } = createClient(false, [connectionError()]);
    const result = await run(client.mutate({ mutation: MUTATION }));
    expect(result.status).toBe("rejected");
    expect(getCalls()).toBe(1);
  });

  test.each([400, 403, 500])("does not retry a query that failed with %i", async (status) => {
    const { client, getCalls } = createClient(false, [serverError(status)]);
    const result = await run(client.query({ query: QUERY }));
    expect(result.status).toBe("rejected");
    expect(getCalls()).toBe(1);
  });
});
