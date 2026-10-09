import { afterEach, describe, expect, it, vi } from "vitest";
import { getRuntimeConfigScript } from "./runtimeEnv";

describe("getRuntimeConfigScript", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes allowlisted public values from the environment", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://runtime@example.test/1");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "runtime");

    const script = getRuntimeConfigScript();

    expect(script).toContain(`"NEXT_PUBLIC_SENTRY_DSN":"https://runtime@example.test/1"`);
    expect(script).toContain(`"NEXT_PUBLIC_SENTRY_ENVIRONMENT":"runtime"`);
  });

  it("does not include values that are not allowlisted", () => {
    vi.stubEnv("SENTRY_AUTH_TOKEN", "secret-token");

    expect(getRuntimeConfigScript()).not.toContain("secret-token");
  });

  it("escapes values that could close the script tag", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_ENVIRONMENT", "</script><script>alert(1)</script>");

    const script = getRuntimeConfigScript();

    expect(script).not.toContain("</script>");
    expect(script).toContain(String.raw`\u003c/script>`);
  });
});
