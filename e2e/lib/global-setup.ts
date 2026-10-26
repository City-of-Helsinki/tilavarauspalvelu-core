/** Runs once before the tests: makes this run's folder for the shared state that replaces PabotLib's server. */
import { resetSharedState } from "./PabotLib";

// oxlint-disable-next-line import/no-default-export -- Playwright loads the global setup's default export
export default async function globalSetup(): Promise<void> {
  await resetSharedState();
}
