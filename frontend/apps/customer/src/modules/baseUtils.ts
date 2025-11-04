// @ts-check
import { getVersion as gitVersion } from "ui/src/modules/baseUtils";
import { env } from "../env.mjs";

/** @returns {string} version string based on GIT */
export function getVersion() {
  return gitVersion(env.NEXT_PUBLIC_SOURCE_BRANCH_NAME, env.NEXT_PUBLIC_SOURCE_VERSION);
}
