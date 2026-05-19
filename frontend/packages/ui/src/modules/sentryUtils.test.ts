import { afterEach, describe, expect, it, vi } from "vitest";
import { beforeSend, beforeSendTransaction, cleanSensitiveData, parseSampleRate } from "./sentryUtils";

describe("parseSampleRate", () => {
  it("returns 0 for undefined or empty string", () => {
    expect(parseSampleRate(undefined)).toBe(0);
    expect(parseSampleRate("")).toBe(0);
  });

  it("returns 0 for NaN or non-numeric input", () => {
    expect(parseSampleRate("foo")).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseSampleRate(null as any)).toBe(0);
  });

  it("clamps values below 0 to 0", () => {
    expect(parseSampleRate("-1")).toBe(0);
    expect(parseSampleRate("-0.5")).toBe(0);
  });

  it("clamps values above 1 to 1", () => {
    expect(parseSampleRate("1.5")).toBe(1);
    expect(parseSampleRate("2")).toBe(1);
  });

  it("returns the value for valid numbers between 0 and 1", () => {
    expect(parseSampleRate("0.5")).toBe(0.5);
    expect(parseSampleRate("1")).toBe(1);
    expect(parseSampleRate("0")).toBe(0);
  });

  it("parses numbers from string and number input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseSampleRate(0.25 as any)).toBe(0.25);
    expect(parseSampleRate("0.25")).toBe(0.25);
  });
});

const hookHint = { source: "test" };

const nestedSensitivePayload = {
  authorization: "Bearer secret-token",
  nested: {
    apiKey: "12345",
    keepMe: "ok",
    list: [
      {
        password: "hidden",
        value: "visible",
      },
      {
        token: "secret",
        safe: true,
      },
    ],
  },
  topLevel: "visible",
};

const nestedSensitivePayloadSanitized = {
  nested: {
    keepMe: "ok",
    list: [
      {
        value: "visible",
      },
      {
        safe: true,
      },
    ],
  },
  topLevel: "visible",
};

type PayloadHook = (event: Record<string, unknown>, hint: unknown) => unknown;

describe("sentry utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("removes denylisted keys recursively from objects and arrays", () => {
    const cleaned = cleanSensitiveData(nestedSensitivePayload);

    expect(cleaned).toStrictEqual(nestedSensitivePayloadSanitized);
  });

  it.each([
    {
      name: "beforeSend",
      hook: beforeSend as PayloadHook,
      payload: {
        request: {
          headers: {
            cookie: "sessionid=abc123",
            accept: "application/json",
          },
        },
        message: "example",
      },
      expected: {
        request: {
          headers: {
            accept: "application/json",
          },
        },
        message: "example",
      },
    },
    {
      name: "beforeSendTransaction",
      hook: beforeSendTransaction as PayloadHook,
      payload: {
        contexts: {
          trace: {
            op: "graphql.query",
          },
        },
        user_session: "secret-session",
        transaction: "home",
      },
      expected: {
        contexts: {
          trace: {
            op: "graphql.query",
          },
        },
        transaction: "home",
      },
    },
  ])("sanitizes payload for $name", ({ hook, payload, expected }) => {
    const result = hook(payload, hookHint);

    expect(result).toStrictEqual(expected);
  });

  it("logs event and hint in development mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const event = { message: "hello" };
    const hint = { reason: "unit-test" };

    beforeSend(event, hint);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, "Sentry event", event);
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "Sentry hint", hint);
  });
});
