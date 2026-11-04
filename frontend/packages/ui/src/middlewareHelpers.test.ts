import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to NEXT_PUBLIC_LOCAL_API_URL with the full client url", () => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "http://localhost:8000");
    const req = createRequest("http://0.0.0.0:3000/search?textSearch=sauna", {}, { host: "localhost:3000" });
    const url = redirectCsrfToken(req);
    expect(url?.origin).toBe("http://localhost:8000");
    expect(url?.pathname).toBe("/csrf/");
    expect(url?.searchParams.get("redirect_to")).toBe("http://localhost:3000/search?textSearch=sauna");
  });

  it("returns undefined if csrftoken cookie exists", () => {
    const req = createRequest("https://example.com/search", { csrftoken: "token" });
    expect(redirectCsrfToken(req)).toBeUndefined();
  });

  it("redirects to the csrf endpoint on the same origin with the path", () => {
    const req = createRequest("https://example.com/en/search");
    const url = redirectCsrfToken(req);
    expect(url?.origin).toBe("https://example.com");
    expect(url?.pathname).toBe("/csrf/");
    expect(url?.searchParams.get("redirect_to")).toBe("/en/search");
  });

  it("keeps the query string in redirect_to", () => {
    const req = createRequest("https://example.com/search?textSearch=sauna&units=1&units=2");
    const url = redirectCsrfToken(req);
    expect(url?.searchParams.get("redirect_to")).toBe("/search?textSearch=sauna&units=1&units=2");
    // the original params must not leak into the csrf url itself
    expect(url?.searchParams.has("textSearch")).toBe(false);
  });

  it("uses the client origin in a container", () => {
    const req = createRequest("http://0.0.0.0:3000/search?textSearch=sauna", {}, { host: "localhost:8080" });
    const url = redirectCsrfToken(req);
    expect(url?.origin).toBe("http://localhost:8080");
    expect(url?.searchParams.get("redirect_to")).toBe("/search?textSearch=sauna");
  });

  it("uses the client origin behind a gateway", () => {
    const req = createRequest(
      "http://0.0.0.0:3000/search",
      {},
      { "x-forwarded-host": "varaamo.hel.fi", "x-forwarded-proto": "https" }
    );
    const url = redirectCsrfToken(req);
    expect(url?.origin).toBe("https://varaamo.hel.fi");
    expect(url?.searchParams.get("redirect_to")).toBe("/search");
  });

  it("keeps the base path of the staff UI in redirect_to", () => {
    const req = createRequest("http://localhost:8080/kasittely/reservations?x=1");
    const url = redirectCsrfToken(req);
    expect(url?.pathname).toBe("/csrf/");
    expect(url?.searchParams.get("redirect_to")).toBe("/kasittely/reservations?x=1");
  });
});
