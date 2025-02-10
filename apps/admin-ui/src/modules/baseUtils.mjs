// @ts-check
import { env } from "../env.mjs";

/** @returns {string} version string based on GIT */
export function getVersion() {
  return (
    env.NEXT_PUBLIC_SOURCE_BRANCH_NAME?.replace("main", "") ||
    env.NEXT_PUBLIC_SOURCE_VERSION?.slice(0, 8) ||
    "local"
  );
}
