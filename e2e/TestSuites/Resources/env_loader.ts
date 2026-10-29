/**
 * Port of env_loader.py: loads secrets from TestSuites/Resources/.env when the file exists.
 * Variables already in the environment win (Docker and CI set them), like load_dotenv(override=False).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const envPath = join(import.meta.dirname, ".env");

if (existsSync(envPath)) {
  // process.loadEnvFile keeps variables that are already set
  process.loadEnvFile(envPath);
}

export const WAF_BYPASS_SECRET = process.env.WAF_BYPASS_SECRET ?? "";
export const ROBOT_API_TOKEN = process.env.ROBOT_API_TOKEN ?? "";
export const DJANGO_ADMIN_PASSWORD = process.env.DJANGO_ADMIN_PASSWORD ?? "";
export const ROBOT_API_ENDPOINT = process.env.ROBOT_API_ENDPOINT ?? "/v1/create_robot_test_data/";

/** The required secrets that are missing, without their values. */
export const missingSecrets = ["WAF_BYPASS_SECRET", "ROBOT_API_TOKEN", "DJANGO_ADMIN_PASSWORD"].filter(
  (name) => (process.env[name] ?? "") === ""
);
