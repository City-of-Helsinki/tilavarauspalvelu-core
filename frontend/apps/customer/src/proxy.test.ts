// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import { proxy } from "./proxy";

vi.mock("@/env.mjs", () => ({ env: { TILAVARAUS_API_URL: "http://backend.test" } }));

/// The error that Node.js fetch throws when it can not connect
function connectionError(): TypeError {
  return new TypeError("fetch failed", { cause: Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" }) });
}

/// A page request of a logged in user
function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: { cookie: "csrftoken=token; sessionid=session; language=fi" },
  });
}

function run(path: string) {
  return proxy(createRequest(path));
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

  test("lets a page without an access check continue", async () => {
    const res = await run("/search");
    expect(res?.headers.get("x-middleware-next")).toBe("1");
    expect(res?.headers.get("x-middleware-rewrite")).toBeNull();
  });

  test("shows the error page for a reservation page", async () => {
    const res = await run("/reservations/12");
    expect(res?.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/503");
  });

  test("shows the error page for an application page", async () => {
    const res = await run("/applications/12/view");
    expect(res?.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/503");
  });

  test("shows the error page in the language of the page", async () => {
    const res = await run("/en/applications/12/view");
    expect(res?.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en/503");
  });
});

describe("proxy for a reservation in progress", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("redirects to the reservation funnel in the language of the page", async () => {
    const data = {
      data: {
        currentUser: { pk: 1 },
        reservation: {
          type: ReservationTypeChoice.Normal,
          state: ReservationStateChoice.Created,
          user: { pk: 1 },
          reservationUnit: { pk: 5 },
        },
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(data)));
    const res = await run("/en/reservations/12");
    expect(res?.headers.get("location")).toBe("http://localhost:3000/en/reservation-unit/5/reservation/12");
  });
});
