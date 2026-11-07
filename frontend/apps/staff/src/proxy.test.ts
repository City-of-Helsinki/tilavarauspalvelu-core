// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { proxy } from "./proxy";

vi.mock("@/env.mjs", () => ({
  env: { TILAVARAUS_API_URL: "http://backend.test", NEXT_PUBLIC_BASE_URL: "/kasittely" },
}));

/// The error that Node.js fetch throws when it can not connect
function connectionError(): TypeError {
  return new TypeError("fetch failed", { cause: Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" }) });
}

describe("proxy when the backend is down", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(connectionError()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("lets the page continue", async () => {
    const req = new NextRequest(new URL("/kasittely/reservations/12", "http://localhost:3000"), {
      headers: { cookie: "csrftoken=token; sessionid=session" },
    });
    const res = await proxy(req);
    expect(res?.headers.get("x-middleware-next")).toBe("1");
    expect(res?.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
