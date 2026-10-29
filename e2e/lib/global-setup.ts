/** Runs once before the tests: makes this run's folder for the locks between the workers. */
import { resetSharedState } from "./locks";

// oxlint-disable-next-line import/no-default-export -- Playwright loads the global setup's default export
export default async function globalSetup(): Promise<void> {
  await resetSharedState();
}
