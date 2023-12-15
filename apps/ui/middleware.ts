import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSignInUrl } from "@/modules/const";

function redirectProtectedRoute(req: NextRequest) {
  // TODO check that the cookie is valid not just present
  const { cookies, headers } = req;
  const hasSession = cookies.has("sessionid");
  if (!hasSession) {
    // on the server we are behind a gateway so get the forwarded headers
    // localhost has no headers
    const currentUrl = req.url;
    const protocol = headers.get("x-forwarded-proto") ?? "http";
    const host = headers.get("x-forwarded-host");
    const originalUrl = headers.get("x-original-url");
    if (host && originalUrl) {
      const origin = `${protocol}://${host}`;
      return getSignInUrl(originalUrl, origin);
    }
    return getSignInUrl(currentUrl);
  }
  return undefined;
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
const doesUrlMatch = (url: string, route: string) => {
  const ref: string[] = url.split("/");
  return ref.includes(route);
};

export const middleware = async (req: NextRequest) => {
  if (authenticatedRoutes.some((route) => doesUrlMatch(req.url, route))) {
    const redirect = redirectProtectedRoute(req);
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }
  }
  return NextResponse.next();
};

export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
};
