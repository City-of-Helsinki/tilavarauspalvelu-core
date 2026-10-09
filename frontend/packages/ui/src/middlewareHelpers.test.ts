import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { redirectCsrfToken } from "./middlewareHelpers";

function createRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
  return {
    url,
    cookies: {
      has: (name: string) => name in cookies,
    },
  } as unknown as NextRequest;
}

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

  it("keeps the host on localhost", () => {
    const req = createRequest("http://localhost:3000/search?textSearch=sauna");
    const url = redirectCsrfToken(req, "http://localhost:8000");
    expect(url?.searchParams.get("redirect_to")).toBe("http://localhost:3000/search?textSearch=sauna");
  });
});
