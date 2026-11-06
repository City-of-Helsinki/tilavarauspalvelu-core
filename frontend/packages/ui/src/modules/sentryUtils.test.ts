import { afterEach, describe, expect, it, vi } from "vitest";
import type { SamplingContext, TracesSamplerSamplingContext } from "@sentry/core";
import {
  beforeSend,
  beforeSendTransaction,
  cleanSensitiveData,
  createServerTracesSampler,
  parseSampleRate,
} from "./sentryUtils";

describe("createServerTracesSampler", () => {
  const POST_LOGIN_URL =
    "https://varaamo.hel.fi/reservation-unit/972?begin=2026-11-14T10%3A30%3A00.000Z&isPostLogin=true";

  // Same logic as inheritOrSampleWith in @sentry/core sampleSpan.
  function createContext(context: SamplingContext): TracesSamplerSamplingContext {
    return {
      ...context,
      inheritOrSampleWith: (fallbackSampleRate) => {
        if (typeof context.parentSampleRate === "number") {
          return context.parentSampleRate;
        }
        if (typeof context.parentSampled === "boolean") {
          return Number(context.parentSampled);
        }
        return fallbackSampleRate;
      },
    };
  }

  it("samples all post login requests", () => {
    const sampler = createServerTracesSampler(0.2);
    expect(sampler(createContext({ name: "GET", normalizedRequest: { url: POST_LOGIN_URL } }))).toBe(1);
    expect(sampler(createContext({ name: "GET", normalizedRequest: { query_string: "isPostLogin=true" } }))).toBe(1);
    expect(
      sampler(createContext({ name: "GET", attributes: { "http.target": "/reservation-unit/972?isPostLogin=true" } }))
    ).toBe(1);
  });

  it("samples a post login request with a not sampled parent", () => {
    const sampler = createServerTracesSampler(0.2);
    const context = createContext({
      name: "GET",
      normalizedRequest: { url: POST_LOGIN_URL },
      parentSampled: false,
      parentSampleRate: 0.2,
    });
    expect(sampler(context)).toBe(1);
  });

  it("uses the sample rate for other requests", () => {
    const sampler = createServerTracesSampler(0.2);
    const url = "https://varaamo.hel.fi/reservation-unit/972";
    expect(sampler(createContext({ name: "GET", normalizedRequest: { url } }))).toBe(0.2);
    expect(sampler(createContext({ name: "GET", normalizedRequest: { url: `${url}?isPostLogin=false` } }))).toBe(0.2);
  });

  it("inherits the parent sample rate for other requests", () => {
    const sampler = createServerTracesSampler(0.2);
    expect(sampler(createContext({ name: "GET", parentSampled: true, parentSampleRate: 0.5 }))).toBe(0.5);
    expect(sampler(createContext({ name: "GET", parentSampled: false, parentSampleRate: 0.05 }))).toBe(0.05);
  });

  it("uses the parent decision when the parent has no sample rate", () => {
    const sampler = createServerTracesSampler(0.2);
    expect(sampler(createContext({ name: "GET", parentSampled: true }))).toBe(1);
    expect(sampler(createContext({ name: "GET", parentSampled: false }))).toBe(0);
  });

  it("does not sample when the sample rate is 0", () => {
    const sampler = createServerTracesSampler(0);
    expect(sampler(createContext({ name: "GET", normalizedRequest: { url: POST_LOGIN_URL } }))).toBe(0);
  });
});

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
