import { NextResponse, type NextRequest } from "next/server";
import { isPageRequest, redirectCsrfToken } from "ui/src/middlewareHelpers";
import { env } from "@/env.mjs";

const API_BASE_URL = env.TILAVARAUS_API_URL ?? "";

export function middleware(req: NextRequest) {
  if (!isPageRequest(new URL(req.url))) {
    return NextResponse.next();
  }

  const csrfRedirectUrl = redirectCsrfToken(req, API_BASE_URL);
  if (csrfRedirectUrl) {
    // block infinite redirect loop (there is no graceful way to handle this)
    if (req.url.includes("redirect_to")) {
      // eslint-disable-next-line no-console
      console.error("Middleware: Infinite redirect loop detected");
      return NextResponse.next();
    }
    return NextResponse.redirect(csrfRedirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      // regex matching page patterns is too error prone, match inside the middleware instead
      source: "/:path*",
      missing: [{ type: "cookie", key: "csrftoken" }],
    },
    // no 401 / 403 redirects because we have to fetch currentUser in SSR anyway
  ],
  runtime: "nodejs",
};
