// @vitest-environment node
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AppContext } from "next/app";
import MyApp from "./pages/_app";

vi.mock("@/env.mjs", () => ({ env: { TILAVARAUS_API_URL: "http://backend.test" } }));
// The test does not render, so the app needs no translations
vi.mock("next-i18next/pages", () => ({ appWithTranslation: <T>(app: T): T => app }));

/// The error that fetchWithTimeout throws when the backend does not answer in time
function timeoutError(): DOMException {
  return new DOMException("Request timed out", "TimeoutError");
}

/// A backend that answers each operation with its data, or fails with the error
function stubBackend(answers: Record<string, unknown>) {
  const fetch = vi.fn((_url: string, init: RequestInit) => {
    const { operationName } = JSON.parse(String(init.body)) as { operationName: string };
    const answer = answers[operationName];
    if (answer instanceof Error) {
      return Promise.reject(answer);
    }
    return Promise.resolve(Response.json({ data: answer }));
  });
  vi.stubGlobal("fetch", fetch);
}

function createContext() {
  const req = {
    url: "/kasittely/reservations",
    headers: { cookie: "csrftoken=token; sessionid=session", host: "localhost:3000" },
    socket: {},
  } as unknown as IncomingMessage;
  const res = { statusCode: 200 } as ServerResponse;
  const context = {
    Component: () => null,
    router: { pathname: "/reservations", basePath: "/kasittely" },
    ctx: { req, res, pathname: "/reservations", query: {}, asPath: "/reservations" },
  } as unknown as AppContext;
  return { context, res };
}

type InitialProps = { isBackendError: boolean; currentUser: unknown; handlingData: unknown };

function getInitialProps(context: AppContext): Promise<InitialProps> {
  // appWithTranslation copies getInitialProps from the wrapped app
  const app = MyApp as unknown as { getInitialProps: (context: AppContext) => Promise<InitialProps> };
  return app.getInitialProps(context);
}

const CURRENT_USER = { currentUser: { id: "VXNlck5vZGU6MQ==", pk: 1 } };
const NOTIFICATIONS = { bannerNotifications: { edges: [] } };

describe("MyApp.getInitialProps", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("keeps the user when the handling data query fails", async () => {
    stubBackend({ CurrentUser: CURRENT_USER, HandlingData: timeoutError(), ShowNotificationsList: NOTIFICATIONS });
    const { context, res } = createContext();
    const props = await getInitialProps(context);
    expect(props.isBackendError).toBe(false);
    expect(props.currentUser).toEqual(CURRENT_USER.currentUser);
    expect(props.handlingData).toBeNull();
    expect(res.statusCode).toBe(200);
  });

  test("shows the error page when the user query fails", async () => {
    stubBackend({ CurrentUser: timeoutError(), HandlingData: {}, ShowNotificationsList: NOTIFICATIONS });
    const { context, res } = createContext();
    const props = await getInitialProps(context);
    expect(props.isBackendError).toBe(true);
    expect(res.statusCode).toBe(503);
  });
});
