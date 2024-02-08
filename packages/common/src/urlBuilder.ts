import { isBrowser } from "./helpers";

/// Returns url for graphql endpoint
/// @param apiUrl - base url for api (hostname typically)
/// @param enableFetchHack a workaround to node-fetch dns problems with localhost
/// @returns url for graphql endpoint
/// only needed on server side, only needed on localhost
/// this will not work with authentication so remove if adding session cookies to SSR requests
export function buildGraphQLUrl(apiUrl: string, enableFetchHack?: boolean) {
  const shouldModifyLocalhost =
    enableFetchHack && !isBrowser && apiUrl.includes("localhost");
  const url = shouldModifyLocalhost
    ? apiUrl.replace("localhost", "127.0.0.1")
    : apiUrl;
  return `${url}${url.endsWith("/") ? "" : "/"}graphql/`;
}

function buildAuthUrl(apiUrl: string) {
  return `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}helauth/`;
}

/// Returns href url for sign in dialog when given redirect url as parameter
/// @param apiBaseUrl - base url for api (hostname typically)
/// @param callBackUrl - url to redirect after successful login
/// @param originOverride - when behind a gateway on a server the url.origin is incorrect
/// @returns url to sign in dialog
export function getSignInUrl(
  apiBaseUrl: string,
  callBackUrl: string,
  originOverride?: string
): string {
  const authUrl = buildAuthUrl(apiBaseUrl);
  if (callBackUrl.includes(`/logout`)) {
    // TODO this is unsound if the callback url is not a full url but this at least redirects to an error page
    const baseUrl =
      originOverride != null ? originOverride : new URL(callBackUrl).origin;
    return `${authUrl}login?next=${baseUrl}`;
  }
  const next =
    originOverride != null ? `${originOverride}/${callBackUrl}` : callBackUrl;
  return `${authUrl}login?next=${next}`;
}

/// @param apiBaseUrl - base url for api (hostname typically)
/// @return url for logging out with redirect url to /logout
export function getSignOutUrl(apiBaseUrl: string): string {
  const authUrl = buildAuthUrl(apiBaseUrl);
  return `${authUrl}logout`;
}
