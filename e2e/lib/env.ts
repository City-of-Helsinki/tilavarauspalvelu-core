/**
 * The environment variables of the suite, read and checked in one place. TestSuites/Resources/.env is loaded first
 * when it exists, and variables already in the environment win (Docker and CI set them). The .env.example next to
 * it lists them all.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const ENV_FILE = join(import.meta.dirname, "..", "TestSuites", "Resources", ".env");

if (existsSync(ENV_FILE)) {
  // process.loadEnvFile keeps variables that are already set
  process.loadEnvFile(ENV_FILE);
}

// Coerces a string to true if it's "true" or "1", false if "false" or "0", like the frontend's coerceBoolean. The case
// doesn't matter, so True works too, and another value fails instead of being false.
const coerceBoolean = z.preprocess(
  (value) => (typeof value === "string" ? value.toLowerCase() : value),
  z
    .enum(["0", "1", "true", "false"])
    .default("false")
    .transform((value) => value === "true" || value === "1")
);

/** The levels of log(), lowest first */
export const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

/** The secrets, which redact() hides */
export const SECRET_NAMES = ["WAF_BYPASS_SECRET", "ROBOT_API_TOKEN", "DJANGO_ADMIN_PASSWORD"] as const;

const EnvSchema = z.object({
  WAF_BYPASS_SECRET: z.string().default(""),
  ROBOT_API_TOKEN: z.string().default(""),
  DJANGO_ADMIN_PASSWORD: z.string().default(""),
  ROBOT_API_ENDPOINT: z.string().default("/v1/create_robot_test_data/"),
  WORKERS: z.coerce.number().int().min(1).default(5),
  RETRIES: z.coerce.number().int().min(0).default(1),
  FORCE_SINGLE_USER: coerceBoolean,
  ENABLE_HAR_RECORDING: coerceBoolean,
  // Playwright's trace modes (TraceMode)
  PW_TRACE: z
    .enum([
      "off",
      "on",
      "retain-on-failure",
      "on-first-retry",
      "on-all-retries",
      "retain-on-first-failure",
      "retain-on-failure-and-retries",
    ])
    .default("off"),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("INFO"),
  LOG_FORMAT: z.enum(["text", "json"]).default("text"),
  // An empty value means the default, .shared-state in e2e/
  SHARED_STATE_DIR: z
    .string()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  // Not a setting: the global setup sets it to this run's folder for the workers (lib/locks.ts)
  SHARED_STATE_RUN_DIR: z.string().optional(),
  // Set by CI services, like GitHub Actions: any value turns it on
  CI: z
    .string()
    .optional()
    .transform((value) => value != null && value !== ""),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * The settings, read from process.env on each call, so that a test can change a variable. Fails with the names of
 * the invalid variables, without their values.
 */
export function readEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment variables: ${problems.join("; ")}`);
  }
  return result.data;
}

/** The required secrets that are missing, without their values. */
export function missingSecrets(): string[] {
  const env = readEnv();
  return SECRET_NAMES.filter((name) => env[name] === "");
}
