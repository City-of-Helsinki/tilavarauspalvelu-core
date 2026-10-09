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
  SENTRY_DSN: "https://runtime@example.test/1",
  SENTRY_ENVIRONMENT: "runtime",
  SENTRY_TRACES_SAMPLE_RATE: "0.25",
  SENTRY_TRACE_PROPAGATION_TARGETS: "https://api.example.test",
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE: "0.1",
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: "1",
  SENTRY_PROJECT: "runtime-project",
};

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
      name: "reads runtime settings from window.__RUNTIME_CONFIG__ in the browser",
      run: async () => {
        const env = await loadWithBrowserConfig(runtimeConfig);

        for (const [key, value] of Object.entries(sentryEnv)) {
          expect(Reflect.get(env, key)).toBe(value);
        }
      },
    },

    {
      name: "does not read runtime settings from the process environment in the browser",
      run: async () => {
        for (const [key, value] of Object.entries(sentryEnv)) {
          vi.stubEnv(key, value);
        }

        const env = await loadWithBrowserConfig({ __RUNTIME_CONFIG__: {} });

        for (const key of Object.keys(sentryEnv)) {
          expect(Reflect.get(env, key)).toBe(undefined);
        }
      },
    },

    {
      name: "reads runtime settings from the server process environment",
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
