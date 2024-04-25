// NOTE middleware can't import lodash or any other library that has
// Dynamic Code Evaluation
// This is because Vercel doesn't support NodeJs as a runtime environment
// and edge doesn't allow Dynamic Code Evaluation
// This app is not edge compatible, but it's impossible to disable the checks.
// Workaround as long as the function isn't needed is to split imports in such a way
// that libraries are not imported in the middleware.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSignInUrl } from "@/modules/const";
import { env } from "@/env.mjs";

const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";

/// should we redirect to the login page
function redirectProtectedRoute(req: NextRequest) {
  // TODO check that the cookie is valid not just present
  const { cookies, headers } = req;
  const hasSession = cookies.has("sessionid");

  if (!hasSession) {
    // on the server we are behind a gateway so get the forwarded headers
    // localhost has no headers
    const currentUrl = req.url;
    const url = new URL(currentUrl);
    const protocol = headers.get("x-forwarded-proto") ?? "http";
    const host = headers.get("x-forwarded-host") ?? url.host;
    const origin = `${protocol}://${host}`;
    return getSignInUrl(apiBaseUrl, url.pathname, origin);
  }
  return undefined;
}

/// are we missing a csrf token in cookies
/// if so get the backend url to redirect to and add the current url as a redirect_to parameter
function redirectCsrfToken(req: NextRequest): URL | undefined {
  const { cookies } = req;
  const hasCsrfToken = cookies.has("csrftoken");
  if (hasCsrfToken) {
    return undefined;
  }

  // need to ignore all assets outside of html requests (which don't have an extension)
  // so could we just check any request that doesn't have an extension?
  const requestUrl = new URL(req.url);
  if (
    // ignore healthcheck because it's for automated test suite that can't do redirects
    requestUrl.pathname.startsWith("/healthcheck") ||
    requestUrl.pathname.startsWith("/_next") ||
    requestUrl.pathname.match(
      /\.(webmanifest|js|css|png|jpg|jpeg|svg|gif|ico|json|woff|woff2|ttf|eot|otf)$/
    )
  ) {
    return undefined;
  }

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

// Run the middleware only on paths that require authentication
// NOTE don't define nested routes, only single word top level routes are supported
// refactor the matcher or fix the underlining matcher issue in nextjs
// matcher syntax: /hard-path/:path* -> /hard-path/anything
// our syntax: hard-path
const authenticatedRoutes = [
  "intro",
  "reservation", //:path*',
  "reservations", //:path*',
  "applications", //:path*',
  "application", //:path*',
  "success",
];
// url matcher that is very specific to our case
function doesUrlMatch(url: string, route: string) {
  const ref: string[] = url.split("/");
  return ref.includes(route);
}

export async function middleware(req: NextRequest) {
  const redirectUrl = redirectCsrfToken(req);
  if (redirectUrl) {
    // block infinite redirect loop (there is no graceful way to handle this)
    if (req.url.includes("redirect_to")) {
      // eslint-disable-next-line no-console
      console.error("Infinite redirect loop detected");
      return NextResponse.next();
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (authenticatedRoutes.some((route) => doesUrlMatch(req.url, route))) {
    const redirect = redirectProtectedRoute(req);
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
};
