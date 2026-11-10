/**
 * @description returns the app version based on GIT
 * @param {string?} branch - git branch name from env
 * @param {string?} sha - git version SHA
 * @returns {string} version string
 **/
export function getVersion(branch?: string, sha?: string) {
  const name = branch === "main" ? "" : branch;
  return name || sha?.slice(0, 8) || "local";
}

/**
 * Sentry reads the release as semver only without the "v" of the git tag.
 * The CI workflows build the same name. Keep them in sync.
 */
export function getReleaseVersion(branch?: string, sha?: string) {
  return getVersion(branch, sha)
    .replace(/^v(?=\d)/, "")
    .replaceAll("/", "-");
}

const isDev = process.env.NODE_ENV === "development";
// no form-action directive because it breaks redirects on chrome
export const CSP_HEADER = `
  base-uri 'self';
  default-src 'self';
  font-src 'self' data:
    makasiini.hel.ninja
    https://*.hotjar.com;
  img-src 'self' blob: data:
    https://m.youtube.com https://www.youtube.com
    https://*.hotjar.com
    ${isDev ? "localhost:* 127.0.0.1:*" : ""};
  script-src 'self' blob
    https://m.youtube.com https://www.youtube.com
    https://webanalytics.digiaiiris.com
    https://*.hotjar.com
    'unsafe-inline'
    ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://*.hotjar.com;
  connect-src 'self' localhost:* 127.0.0.1:*
    https://webanalytics.digiaiiris.com
    https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com
    https://sentry.test.hel.ninja
    https://sentry.hel.fi
    https://city-of-helsinki.sentry.io;
  object-src 'none';
  frame-src https://palvelukartta.hel.fi;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
