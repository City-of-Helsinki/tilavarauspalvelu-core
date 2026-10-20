import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { getClientUrl, redirectCsrfToken } from "./middlewareHelpers";

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
