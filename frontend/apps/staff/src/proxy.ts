import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logError } from "@ui/modules/errors";
import { isPageRequest, redirectCsrfToken } from "ui/src/middlewareHelpers";
import { removeTrailingSlash } from "ui/src/modules/urlBuilder";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "./modules/const";

const API_BASE_URL = env.TILAVARAUS_API_URL ?? "";

/// Redirect to the backend when the CSRF token is missing.
/// The middleware makes no backend requests. The pages query the user themselves, in _app.
function handleRequest(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const basePath = removeTrailingSlash(env.NEXT_PUBLIC_BASE_URL ?? "");
  const sentryTunnelPath = `${basePath}/monitoring`;

  // Allow Sentry tunnel route to pass through without auth/csrf middleware redirects.
  if (pathname === sentryTunnelPath || pathname === "/monitoring") {
    return NextResponse.next();
  }

  if (!isPageRequest(new URL(req.url), PUBLIC_URL)) {
    return NextResponse.next();
  }
  const csrfRedirectUrl = redirectCsrfToken(req, API_BASE_URL);
  if (csrfRedirectUrl) {
    // block infinite redirect loop (there is no graceful way to handle this)
    if (req.url.includes("redirect_to")) {
      logError("Middleware: Infinite redirect loop detected");
      return NextResponse.next();
    }
    return NextResponse.redirect(csrfRedirectUrl);
  }
  return NextResponse.next();
}

// Turbopack does not add the Sentry wrapper automatically.
// The wrapper adds the request data to the middleware span and to errors.
export const proxy = Sentry.wrapMiddlewareWithSentry(handleRequest);

export const config = {
  matcher: [
    {
      // regex matching page patterns is too error prone, match inside the middleware instead
      source: "/:path*",
    },
  ],
};
