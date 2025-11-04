/**
 * @description returns the app version based on GIT
 * @param {string?} branch - git branch name from env
 * @param {string?} sha - git version SHA
 * @returns {string} version string
 **/
export function getVersion(branch?: string, sha?: string) {
  return branch?.replace("main", "") || sha?.slice(0, 8) || "local";
}
