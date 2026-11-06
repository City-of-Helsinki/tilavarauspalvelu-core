import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidEnvError } from "./errors";
import {
  getBrowserApiBaseUrl,
  getClientOrigin,
  getSignInUrl,
  getSignOutUrl,
  warnIfLocalApiUrlMissing,
} from "./urlBuilder";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getBrowserApiBaseUrl", () => {
  it("is empty without NEXT_PUBLIC_LOCAL_API_URL", () => {
    expect(getBrowserApiBaseUrl()).toBe("");
  });

  it("returns NEXT_PUBLIC_LOCAL_API_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "http://localhost:8000/");
    expect(getBrowserApiBaseUrl()).toBe("http://localhost:8000");
  });

  it("throws if NEXT_PUBLIC_LOCAL_API_URL is not a url", () => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "localhost:8000");
    expect(() => getBrowserApiBaseUrl()).toThrow(InvalidEnvError);
  });
});

describe("warnIfLocalApiUrlMissing", () => {
  it("warns in development without NEXT_PUBLIC_LOCAL_API_URL", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfLocalApiUrlMissing();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("does not warn with NEXT_PUBLIC_LOCAL_API_URL", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "http://localhost:8000");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfLocalApiUrlMissing();
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not warn in production, where the value is empty", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfLocalApiUrlMissing();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("getSignOutUrl", () => {
  it("returns a path without NEXT_PUBLIC_LOCAL_API_URL", () => {
    expect(getSignOutUrl()).toBe("/helauth/logout/");
  });

  it("uses NEXT_PUBLIC_LOCAL_API_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "http://localhost:8000");
    expect(getSignOutUrl()).toBe("http://localhost:8000/helauth/logout/");
  });
});

describe("getSignInUrl", () => {
  it("returns a path without NEXT_PUBLIC_LOCAL_API_URL", () => {
    const url = getSignInUrl({ callBackUrl: "/reservations", language: "fi", client: "customer" });
    expect(url.startsWith("/helauth/login/?")).toBe(true);
  });

  it("uses NEXT_PUBLIC_LOCAL_API_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_URL", "http://localhost:8000");
    const url = getSignInUrl({ callBackUrl: "http://localhost:3000/reservations", language: "fi", client: "customer" });
    expect(url.startsWith("http://localhost:8000/helauth/login/?")).toBe(true);
  });

  it("keeps the query string of the callback url in next", () => {
    const url = new URL(
      getSignInUrl({
        callBackUrl: "/reservations?textSearch=sauna&units=1&units=2",
        language: "fi",
        client: "customer",
      }),
      "https://example.com"
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
        callBackUrl,
        language: "fi",
        client: "customer",
        originOverride,
      }),
      "https://example.com"
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
