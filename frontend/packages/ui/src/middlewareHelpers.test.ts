import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { NON_PAGE_PATH, PUBLIC_FILE_PATH, getClientUrl, isPageRequest, redirectCsrfToken } from "./middlewareHelpers";

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

// Page paths. Sentry must keep their transactions and the proxy must run for them.
const PAGE_PATHS = [
  "/",
  "/en",
  "/fi/reservation-unit/1164",
  "/reservations/12/confirmation",
  "/kasittely/reservations/12",
  // A file extension or an /api/ path in the query string must not match
  "/search?x=a.js",
  "/search?next=/api/graphql",
  "/search?next=/monitoring",
  "/monitoring-reports",
  // Catch-all pages accept extra segments. /api/, /_next/ and /monitoring deeper in the path must not match.
  "/reservation-unit/1/reservation/2/api/x",
  "/reservation-unit/1/reservation/2/_next/x",
  "/reservation-unit/1/reservation/2/monitoring",
];

describe("NON_PAGE_PATH", () => {
  it.each([
    "/_next/static/chunks/1ylhy733c1rs4.js",
    "/_next/data/build-id/fi/reservation-unit/1.json",
    "/_next/image?url=%2Flogo.png&w=64&q=75",
    "/kasittely/_next/static/chunks/main.js",
    "/api/graphql",
    "/api/healthcheck",
    "/kasittely/api/healthcheck",
    "/favicon.svg",
    "/favicon-32x32.ico",
    "/manifest.webmanifest",
    "/robots.txt",
    "/main.js?v=1",
    // The Sentry tunnel, with and without the base path
    "/monitoring",
    "/monitoring?o=123&p=456&r=de",
    "/kasittely/monitoring",
  ])("matches %s", (path) => {
    expect(NON_PAGE_PATH.test(path)).toBe(true);
  });

  it.each(PAGE_PATHS)("does not match %s", (path) => {
    expect(NON_PAGE_PATH.test(path)).toBe(false);
  });
});

describe("PUBLIC_FILE_PATH", () => {
  it.each(["/favicon.svg", "/favicon-32x32.ico", "/kasittely/logo.png", "/images/main.jpg?v=1", "/robots.txt"])(
    "matches %s",
    (path) => {
      expect(PUBLIC_FILE_PATH.test(path)).toBe(true);
    }
  );

  it.each([
    ...PAGE_PATHS,
    // Data requests run getServerSideProps. Sentry must keep their transactions.
    "/_next/data/build-id/fi/reservation-unit/1.json",
    "/kasittely/_next/data/build-id/reservations/1.json",
    "/_next/static/chunks/main.js",
    "/api/graphql",
  ])("does not match %s", (path) => {
    expect(PUBLIC_FILE_PATH.test(path)).toBe(false);
  });
});

describe("isPageRequest", () => {
  it.each(PAGE_PATHS)("is true for %s", (path) => {
    expect(isPageRequest(new URL(path, "http://localhost:3000"))).toBe(true);
  });

  it.each(["/_next/static/chunks/main.js", "/api/graphql", "/favicon.svg", "/monitoring", "/healthcheck", "/en/503"])(
    "is false for %s",
    (path) => {
      expect(isPageRequest(new URL(path, "http://localhost:3000"))).toBe(false);
    }
  );

  it("is false for the healthcheck under a base path", () => {
    expect(isPageRequest(new URL("http://localhost:3000/kasittely/healthcheck"), "/kasittely")).toBe(false);
  });
});
