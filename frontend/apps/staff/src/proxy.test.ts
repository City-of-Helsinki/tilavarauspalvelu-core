// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { proxy } from "./proxy";

vi.mock("@/env.mjs", () => ({
  env: { TILAVARAUS_API_URL: "http://backend.test", NEXT_PUBLIC_BASE_URL: "/kasittely" },
}));

function createRequest(cookie: string): NextRequest {
  return new NextRequest(new URL("/kasittely/reservations/12", "http://localhost:3000"), { headers: { cookie } });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("lets the page continue without a backend request", async () => {
    const res = await proxy(createRequest("csrftoken=token; sessionid=session"));
    expect(res?.headers.get("x-middleware-next")).toBe("1");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("redirects to the backend for the CSRF token", async () => {
    const res = await proxy(createRequest("sessionid=session"));
    expect(res?.headers.get("location")).toBe(
      "http://backend.test/csrf/?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fkasittely%2Freservations%2F12"
    );
  });
});
