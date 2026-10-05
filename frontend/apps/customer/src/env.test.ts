// oxlint-disable vitest/valid-title
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntimePublicEnvTests } from "../../../test-utils/runtime-public-env-tests";

const runtimeEnvTests = createRuntimePublicEnvTests({ expect, vi }, async () => {
  return (await import("./env.mjs")).env;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("runtime public environment", () => {
  it(runtimeEnvTests[0].name, runtimeEnvTests[0].run);
  it(runtimeEnvTests[1].name, runtimeEnvTests[1].run);
  it(runtimeEnvTests[2].name, runtimeEnvTests[2].run);
});
