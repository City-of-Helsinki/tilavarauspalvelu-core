import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const publicRuntimeEnvKeys = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_TRACE_PROPAGATION_TARGETS",
  "NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_PROJECT",
];

const targetDir = process.argv[2] ?? path.resolve(process.cwd(), "public");
const targetFile = path.join(targetDir, "env-config.js");
const runtimeConfig = Object.fromEntries(
  publicRuntimeEnvKeys.flatMap((key) => {
    const value = process.env[key];
    return value === undefined ? [] : [[key, value]];
  })
);
const serializedConfig = JSON.stringify(runtimeConfig).replaceAll("<", String.raw`\u003c`);
const content = "window.__RUNTIME_CONFIG__=" + serializedConfig + ";\n";

mkdirSync(targetDir, { recursive: true });
writeFileSync(targetFile, content, "utf8");
