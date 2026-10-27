// @ts-check
import { getVersion as gitVersion } from "ui/src/modules/baseUtils";
import { env } from "../env.mjs";

/// Marks our own code in the browser bundle for thirdPartyErrorFilterIntegration.
/// The build and the client init must use the same value, so do not read it from the env.
export const SENTRY_APPLICATION_KEY = "varaamo-customer";

/** @returns {string} version string based on GIT */
export function getVersion() {
  return gitVersion(env.NEXT_PUBLIC_SOURCE_BRANCH_NAME, env.NEXT_PUBLIC_SOURCE_VERSION);
}

/**
 * Returns the version string for the customer app
 * @returns {string}
 */
export function getCustomerRelease() {
  // Use SENTRY_PROJECT for consistency with Sentry config and runtime
  const app = env.SENTRY_PROJECT || "tilavarauspalvelu-customer-ui";
  const version = getVersion().replaceAll("/", "-");
  return `${app}@${version}`;
}
