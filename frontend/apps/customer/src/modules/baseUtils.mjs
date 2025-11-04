// @ts-check
/**
 * js because this needs to be imported in next.config.mjs (i.e. during build time) so we can't transpile ts to js
 * the duplicate function in staff/src/modules/baseUtils.mjs is by design
 */
import { getVersion as gitVersion } from "ui/src/modules/baseUtils.mjs";
import { env } from "../env.mjs";

/** @returns {string} version string based on GIT */
export function getVersion() {
  "use strict";
  return gitVersion(env.NEXT_PUBLIC_SOURCE_BRANCH_NAME, env.NEXT_PUBLIC_SOURCE_VERSION);
}
