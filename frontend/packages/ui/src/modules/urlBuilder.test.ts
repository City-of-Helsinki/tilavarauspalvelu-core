import { describe, expect, it } from "vitest";
import { getSignInUrl } from "./urlBuilder";

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
