import type { IncomingHttpHeaders } from "node:http";

export type UserTypeChoice = "customer" | "admin";
export type LocalizationLanguages = "fi" | "sv" | "en";

/// Returns url for graphql endpoint
/// @param apiUrl - base url for api (hostname typically)
/// @returns url for graphql endpoint
export function buildGraphQLUrl(apiUrl: string) {
  return `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}graphql/`;
}

/// Works both in the browser and on the server (including middleware)
export function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/// Returns the first value of a request header. Proxies can send a comma separated list.
function getFirstHeaderValue(headers: Headers | IncomingHttpHeaders, name: string): string | null {
  const value = headers instanceof Headers ? headers.get(name) : headers[name];
  const first = (Array.isArray(value) ? value[0] : value)?.split(",")[0]?.trim();
  return first || null;
}

/// Returns the origin that the client used for the request, for example "https://varaamo.hel.fi".
/// Only for the server. In the browser use window.location.
/// The request url on the server has the address that the server listens on, for example "http://0.0.0.0:3000".
/// A gateway sets the x-forwarded headers. Without a gateway, the Host header has the host that the client used.
/// @param headers - request headers in the proxy (Headers) or in getServerSideProps (IncomingHttpHeaders)
/// @param requestProtocol - protocol of the connection to this server, "http" or "https"
/// @returns origin or null if the request has no host header
export function getClientOrigin(headers: Headers | IncomingHttpHeaders, requestProtocol?: string): string | null {
  const host = getFirstHeaderValue(headers, "x-forwarded-host") ?? getFirstHeaderValue(headers, "host");
  if (host == null) {
    return null;
  }
  // Without a gateway, the client connects to this server, so the protocol of that connection is correct.
  const proto = getFirstHeaderValue(headers, "x-forwarded-proto") ?? requestProtocol ?? "http";
  return `${proto}://${host}`;
}

function buildAuthUrl(apiUrl: string) {
  return `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}helauth/`;
}

/// Returns href url for sign in dialog when given redirect url as parameter
/// @param apiBaseUrl - base url for api (hostname typically)
/// @param callBackUrl - url to redirect after successful login
/// @param originOverride - when behind a gateway on a server the url.origin is incorrect
/// @returns url to sign in dialog
export function getSignInUrl({
  apiBaseUrl,
  callBackUrl,
  language,
  client,
  originOverride,
}: {
  apiBaseUrl: string;
  callBackUrl: string;
  language: LocalizationLanguages;
  client: UserTypeChoice;
  originOverride?: string;
}): string {
  const loginUrl = new URL(`${buildAuthUrl(apiBaseUrl)}login/`);

  if (callBackUrl.includes(`/logout`)) {
    // NOTE this is unsound if the callback url is not a full url but at least it redirects to an error page
    loginUrl.searchParams.set("next", originOverride ?? new URL(callBackUrl).origin);
    return loginUrl.toString();
  }
  loginUrl.searchParams.set("ui", client);
  if (client === "customer") {
    loginUrl.searchParams.set("lang", language);
  }
  const next =
    originOverride != null ? `${removeTrailingSlash(originOverride)}/${callBackUrl.replace(/^\/+/, "")}` : callBackUrl;
  loginUrl.searchParams.set("next", next);
  return loginUrl.toString();
}

/// @param apiBaseUrl - base url for api (hostname typically)
/// @return url for logging out with redirect url to /logout
export function getSignOutUrl(apiBaseUrl: string): string {
  const authUrl = buildAuthUrl(apiBaseUrl);
  return `${authUrl}logout/`;
}
