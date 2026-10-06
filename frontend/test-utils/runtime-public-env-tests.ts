type TestFramework = {
  expect: (actual: unknown) => { toBe: (expected: unknown) => void };
  vi: {
    resetModules: () => void;
    stubEnv: (key: string, value: string) => void;
    stubGlobal: (key: string, value: unknown) => void;
    unstubAllEnvs: () => void;
    unstubAllGlobals: () => void;
  };
};

type RuntimeEnvironment = object;

const sentryEnv = {
  NEXT_PUBLIC_SENTRY_DSN: "https://runtime@example.test/1",
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: "runtime",
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "0.25",
  NEXT_PUBLIC_SENTRY_TRACE_PROPAGATION_TARGETS: "https://api.example.test",
  NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: "0.1",
  NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: "1",
  NEXT_PUBLIC_SENTRY_PROJECT: "runtime-project",
};

const buildEnv = Object.fromEntries(Object.keys(sentryEnv).map((key) => [key, `build-${key}`]));
const runtimeConfig = { __RUNTIME_CONFIG__: sentryEnv };

export function createRuntimePublicEnvTests({ expect, vi }: TestFramework, loadEnv: () => Promise<RuntimeEnvironment>) {
  function loadWithBrowserConfig(config: object) {
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubGlobal("window", config);
    vi.resetModules();
    return loadEnv();
  }

  return [
    {
      name: "prefers browser runtime values over build-time values",
      run: async () => {
        for (const [key, value] of Object.entries(buildEnv)) {
          vi.stubEnv(key, value);
        }

        const env = await loadWithBrowserConfig(runtimeConfig);

        for (const [key, value] of Object.entries(sentryEnv)) {
          expect(Reflect.get(env, key)).toBe(value);
        }
      },
    },

    {
      name: "falls back to build-time values when browser runtime values are absent",
      run: async () => {
        for (const [key, value] of Object.entries(buildEnv)) {
          vi.stubEnv(key, value);
        }

        const env = await loadWithBrowserConfig({ __RUNTIME_CONFIG__: {} });

        for (const [key, value] of Object.entries(buildEnv)) {
          expect(Reflect.get(env, key)).toBe(value);
        }
      },
    },

    {
      name: "reads public settings from the server process environment",
      run: async () => {
        for (const [key, value] of Object.entries(sentryEnv)) {
          vi.stubEnv(key, value);
        }
        vi.stubEnv("SKIP_ENV_VALIDATION", "true");
        vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
        vi.stubGlobal("window", undefined);
        vi.resetModules();

        const env = await loadEnv();

        for (const [key, value] of Object.entries(sentryEnv)) {
          expect(Reflect.get(env, key)).toBe(value);
        }
      },
    },
  ] as const;
}
