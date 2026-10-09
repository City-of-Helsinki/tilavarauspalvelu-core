// Public settings that are read from the container environment on each request.
// This lets the same image run in all environments.
// Static pages (404, 500) are rendered at build time, so they use the build-time values.
const PUBLIC_RUNTIME_ENV_KEYS = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_TRACE_PROPAGATION_TARGETS",
  "NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_PROJECT",
] as const;

/// Server only. Returns an inline script that sets window.__RUNTIME_CONFIG__.
export function getRuntimeConfigScript(): string {
  const runtimeConfig = Object.fromEntries(
    PUBLIC_RUNTIME_ENV_KEYS.flatMap((key) => {
      // Dynamic lookup is intentional: Next.js does not inline it at build time.
      const value = process.env[key];
      return value === undefined ? [] : [[key, value]];
    })
  );
  // Escape "<" so a value can not close the script tag.
  const serializedConfig = JSON.stringify(runtimeConfig).replaceAll("<", String.raw`\u003c`);
  return `window.__RUNTIME_CONFIG__=${serializedConfig};`;
}
