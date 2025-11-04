/**
 * @description returns the app version based on GIT
 * @param {string | undefined } branch - git branch name from env
 * @param {string | undefined } sha - git version SHA
 * @returns {string} version string
 **/
export function getVersion(branch, sha) {
  "use strict";
  var safeBranch = branch || "";
  var safeSha = sha || "";
  return safeBranch.replace("main", "") || safeSha.slice(0, 8) || "local";
}
