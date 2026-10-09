import { afterEach, describe, expect, it, vi } from "vitest";
import { getRuntimeConfigScript } from "./runtimeEnv";

const KEYS = ["SENTRY_DSN", "SENTRY_ENVIRONMENT", "SENTRY_PROJECT"];

describe("getRuntimeConfigScript", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes the given keys from the environment", () => {
    vi.stubEnv("SENTRY_DSN", "https://runtime@example.test/1");
    vi.stubEnv("SENTRY_ENVIRONMENT", "runtime");

    const script = getRuntimeConfigScript(KEYS);

    expect(script).toContain(`"SENTRY_DSN":"https://runtime@example.test/1"`);
    expect(script).toContain(`"SENTRY_ENVIRONMENT":"runtime"`);
  });

  it("leaves out keys that are not set", () => {
    vi.stubEnv("SENTRY_DSN", "https://runtime@example.test/1");
    vi.stubEnv("SENTRY_PROJECT", undefined);

    expect(getRuntimeConfigScript(KEYS)).not.toContain("SENTRY_PROJECT");
  });

  it("does not include values for other keys", () => {
    vi.stubEnv("SENTRY_AUTH_TOKEN", "secret-token");

    expect(getRuntimeConfigScript(KEYS)).not.toContain("secret-token");
  });

  it("escapes values that could close the script tag", () => {
    vi.stubEnv("SENTRY_ENVIRONMENT", "</script><script>alert(1)</script>");

    const script = getRuntimeConfigScript(KEYS);

    expect(script).not.toContain("</script>");
    expect(script).toContain(String.raw`\u003c/script>`);
  });
});
