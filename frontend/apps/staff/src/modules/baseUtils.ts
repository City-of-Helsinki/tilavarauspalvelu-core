// @ts-check
import { getVersion as gitVersion } from "ui/src/modules/baseUtils";
import { env } from "../env.mjs";

/** @returns {string} version string based on GIT */
export function getVersion() {
  return gitVersion(env.NEXT_PUBLIC_SOURCE_BRANCH_NAME, env.NEXT_PUBLIC_SOURCE_VERSION);
}

/**
 * Returns the version string for the staff app
 * @returns {string}
 */
export function getStaffRelease() {
  // Use NEXT_PUBLIC_SENTRY_PROJECT for consistency with Sentry config and runtime
  const app = env.NEXT_PUBLIC_SENTRY_PROJECT || "tilavarauspalvelu-staff-ui";
  const version = getVersion().replaceAll("/", "-");
  return `${app}@${version}`;
}
