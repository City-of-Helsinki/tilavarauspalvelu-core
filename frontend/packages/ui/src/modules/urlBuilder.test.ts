import { describe, expect, it } from "vitest";
import { getClientOrigin, getSignInUrl } from "./urlBuilder";

describe("getSignInUrl", () => {
  it("keeps the query string of the callback url in next", () => {
    const url = new URL(
      getSignInUrl({
        apiBaseUrl: "https://api.example.com",
        callBackUrl: "/reservations?textSearch=sauna&units=1&units=2",
        language: "fi",
        client: "customer",
      })
    );
    expect(url.pathname).toBe("/helauth/login/");
    expect(url.searchParams.get("next")).toBe("/reservations?textSearch=sauna&units=1&units=2");
    // the callback params must not leak into the login url itself
    expect(url.searchParams.has("units")).toBe(false);
    expect(url.searchParams.get("ui")).toBe("customer");
    expect(url.searchParams.get("lang")).toBe("fi");
  });

  it.each([
    ["https://example.com", "/reservations?x=1"],
    ["https://example.com/", "/reservations?x=1"],
    ["https://example.com", "reservations?x=1"],
    ["https://example.com", "//reservations?x=1"],
  ])("joins origin %s and path %s with one slash", (originOverride, callBackUrl) => {
    const url = new URL(
      getSignInUrl({
        apiBaseUrl: "https://api.example.com",
        callBackUrl,
        language: "fi",
        client: "customer",
        originOverride,
      })
    );
    expect(url.searchParams.get("next")).toBe("https://example.com/reservations?x=1");
  });
});

describe("getClientOrigin", () => {
  it("uses the forwarded host and proto", () => {
    const headers = new Headers({
      host: "0.0.0.0:3000",
      "x-forwarded-host": "varaamo.hel.fi",
      "x-forwarded-proto": "https",
    });
    expect(getClientOrigin(headers)).toBe("https://varaamo.hel.fi");
  });

  it("uses the first value of a forwarded list", () => {
    const headers = new Headers({
      "x-forwarded-host": "varaamo.hel.fi, gateway.internal",
      "x-forwarded-proto": "https, http",
    });
    expect(getClientOrigin(headers)).toBe("https://varaamo.hel.fi");
  });

  it("uses the host header with http without a gateway", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(getClientOrigin(headers)).toBe("http://localhost:3000");
  });

  it("uses the request protocol without a forwarded proto", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(getClientOrigin(headers, "https")).toBe("https://localhost:3000");
  });

  it("prefers the forwarded proto over the request protocol", () => {
    const headers = new Headers({ "x-forwarded-host": "varaamo.hel.fi", "x-forwarded-proto": "https" });
    expect(getClientOrigin(headers, "http")).toBe("https://varaamo.hel.fi");
  });

  it("reads node request headers", () => {
    expect(getClientOrigin({ host: "localhost:3000", "x-forwarded-proto": ["https"] })).toBe("https://localhost:3000");
  });

  it("returns null without a host", () => {
    expect(getClientOrigin(new Headers())).toBeNull();
    expect(getClientOrigin({})).toBeNull();
  });
});
