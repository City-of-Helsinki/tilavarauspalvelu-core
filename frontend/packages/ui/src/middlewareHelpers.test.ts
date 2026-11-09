import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, test, vi } from "vitest";
import { getClientUrl, gqlQueryFetch, redirectCsrfToken } from "./middlewareHelpers";
import { GraphQLFetchError } from "./modules/errors";

function createRequest(
  url: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  return {
    url,
    headers: new Headers(headers),
    cookies: {
      has: (name: string) => name in cookies,
    },
  } as unknown as NextRequest;
}

describe("getClientUrl", () => {
  it("returns the request url without a host header", () => {
    const req = createRequest("http://localhost:3000/search?x=1");
    expect(getClientUrl(req).href).toBe("http://localhost:3000/search?x=1");
  });

  it("uses the host header in a container", () => {
    const req = createRequest("http://0.0.0.0:3000/search?x=1", {}, { host: "localhost:3000" });
    expect(getClientUrl(req).href).toBe("http://localhost:3000/search?x=1");
  });

  it("keeps the https protocol of the request without a gateway", () => {
    const req = createRequest("https://0.0.0.0:3000/search?x=1", {}, { host: "localhost:3000" });
    expect(getClientUrl(req).href).toBe("https://localhost:3000/search?x=1");
  });

  it("uses the forwarded headers behind a gateway", () => {
    const req = createRequest(
      "http://0.0.0.0:3000/kasittely/units?x=1",
      {},
      { host: "0.0.0.0:3000", "x-forwarded-host": "varaamo.hel.fi", "x-forwarded-proto": "https" }
    );
    expect(getClientUrl(req).href).toBe("https://varaamo.hel.fi/kasittely/units?x=1");
  });
});

describe("redirectCsrfToken", () => {
  it("returns undefined if csrftoken cookie exists", () => {
    const req = createRequest("https://example.com/search", { csrftoken: "token" });
    expect(redirectCsrfToken(req, "https://api.example.com")).toBeUndefined();
  });

  it("redirects to the csrf endpoint with the path", () => {
    const req = createRequest("https://example.com/en/search");
    const url = redirectCsrfToken(req, "https://api.example.com");
    expect(url?.origin).toBe("https://api.example.com");
    expect(url?.pathname).toBe("/csrf/");
    expect(url?.searchParams.get("redirect_to")).toBe("/en/search");
  });

  it("keeps the query string in redirect_to", () => {
    const req = createRequest("https://example.com/search?textSearch=sauna&units=1&units=2");
    const url = redirectCsrfToken(req, "https://api.example.com");
    expect(url?.searchParams.get("redirect_to")).toBe("/search?textSearch=sauna&units=1&units=2");
    // the original params must not leak into the csrf url itself
    expect(url?.searchParams.has("textSearch")).toBe(false);
  });

  it("keeps the client host on localhost in a container", () => {
    const req = createRequest("http://0.0.0.0:3000/search?textSearch=sauna", {}, { host: "localhost:3000" });
    const url = redirectCsrfToken(req, "http://localhost:8000");
    expect(url?.searchParams.get("redirect_to")).toBe("http://localhost:3000/search?textSearch=sauna");
  });

  it("keeps only the path behind a gateway", () => {
    const req = createRequest(
      "http://0.0.0.0:3000/search",
      {},
      { "x-forwarded-host": "varaamo.hel.fi", "x-forwarded-proto": "https" }
    );
    const url = redirectCsrfToken(req, "https://varaamo.hel.fi");
    expect(url?.searchParams.get("redirect_to")).toBe("/search");
  });

  it("keeps the host on localhost", () => {
    const req = createRequest("http://localhost:3000/search?textSearch=sauna");
    const url = redirectCsrfToken(req, "http://localhost:8000");
    expect(url?.searchParams.get("redirect_to")).toBe("http://localhost:3000/search?textSearch=sauna");
  });
});

const API_URL = "http://localhost:8000";

function createGqlRequest(): NextRequest {
  const req = new NextRequest("http://localhost:3000/fi");
  // NOTE the test environment drops the cookie header (browsers don't allow it), so set the cookie directly
  req.cookies.set("csrftoken", "token");
  return req;
}

/// The error that Node.js fetch throws when it can not connect
function connectionError(): TypeError {
  return new TypeError("fetch failed", { cause: Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" }) });
}

function okResponse(): Response {
  return new Response(JSON.stringify({ data: { currentUser: null } }), { status: 200 });
}

describe("gqlQueryFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("sends a query again once if there was no connection", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(connectionError()).mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const data = await gqlQueryFetch(
      createGqlRequest(),
      { query: "query GetCurrentUser { currentUser { pk } }" },
      API_URL
    );
    expect(data).toEqual({ data: { currentUser: null } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("sends a query only twice", async () => {
    const fetchMock = vi.fn().mockRejectedValue(connectionError());
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      gqlQueryFetch(createGqlRequest(), { query: "query GetCurrentUser { currentUser { pk } }" }, API_URL)
    ).rejects.toThrow("fetch failed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("never sends a mutation again", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(connectionError()).mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    const mutation = "mutation SaveUserLanguage { updateStaffUser(input: {}) { pk } }";
    await expect(gqlQueryFetch(createGqlRequest(), { query: mutation }, API_URL)).rejects.toThrow("fetch failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("keeps the status of an error response that is not JSON", async () => {
    const gatewayError = new Response("<html><body>502 Bad Gateway</body></html>", {
      status: 502,
      statusText: "Bad Gateway",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(gatewayError));

    const request = gqlQueryFetch(
      createGqlRequest(),
      { query: "query GetCurrentUser { currentUser { pk } }" },
      API_URL
    );
    await expect(request).rejects.toBeInstanceOf(GraphQLFetchError);
    await expect(request).rejects.toThrow("GraphQLFetchError 502 Bad Gateway");
    await expect(request).rejects.toMatchObject({ data: "<html><body>502 Bad Gateway</body></html>" });
  });

  test("keeps the JSON body of an error response", async () => {
    const errorBody = { errors: [{ message: "Bad request" }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(errorBody), { status: 400 })));

    const request = gqlQueryFetch(
      createGqlRequest(),
      { query: "query GetCurrentUser { currentUser { pk } }" },
      API_URL
    );
    await expect(request).rejects.toMatchObject({ data: errorBody });
  });

  test("does not send a query again after other errors", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      gqlQueryFetch(createGqlRequest(), { query: "query GetCurrentUser { currentUser { pk } }" }, API_URL)
    ).rejects.toThrow("boom");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
