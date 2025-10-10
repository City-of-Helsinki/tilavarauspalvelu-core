/// NOTE don't include nodejs packages (like node:* or lodash) this requires edge runtime due to NextJs design
import { NextRequest } from "next/server";

/// Check if the request is a page request
/// @param url - URL
export function isPageRequest(url: URL): boolean {
  if (
    // ignore healthcheck because it's for automated test suite that can't do redirects
    url.pathname.startsWith("/healthcheck") ||
    url.pathname.startsWith("/api/healthcheck") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.match(/\.(webmanifest|js|css|png|jpg|jpeg|svg|gif|ico|json|woff|woff2|ttf|eot|otf|pdf)$/) ||
    url.pathname.startsWith("/503") ||
    url.pathname.startsWith("/en/503") ||
    url.pathname.startsWith("/sv/503")
  ) {
    return false;
  }
  return true;
}

/// check if csrftoken is missing and construct redirect url for it
/// if we should redirect then construct the backend url with (original) req url as the return address
/// @param req The request processed in the middleware
/// @param apiBaseUrl Host url for backend
/// @return redirect url or undefined if we should not redirect
export function redirectCsrfToken(req: NextRequest, apiBaseUrl: string): URL | undefined {
  const { cookies } = req;
  const hasCsrfToken = cookies.has("csrftoken");
  if (hasCsrfToken) {
    return undefined;
  }

  const requestUrl = new URL(req.url);
  const csrfUrl = `${apiBaseUrl}/csrf/`;
  const redirectUrl = new URL(csrfUrl);

  // On server envs everything is in the same domain and 80/443 ports, so ignore the host part of the url.
  // More robust solution (supporting separate domains) would need to take into account us being behind
  // a gateway so the public url doesn't match the internal url.
  const origin = requestUrl.origin;
  const hostPart = origin.includes("localhost") ? origin : "";
  const next = `${hostPart}${requestUrl.pathname}`;
  redirectUrl.searchParams.set("redirect_to", next);

  return redirectUrl;
}
