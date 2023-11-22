import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSignInUrl } from "@/modules/const";

function redirectProtectedRoute (req: NextRequest) {
  // TODO check that the cookie is valid not just present
  const { cookies } = req
  const hasSession = cookies.has('sessionid');
  if (!hasSession) {
    const currentUrl = req.url
    return getSignInUrl(currentUrl)
  }
  return undefined;
}

export const middleware = async (req: NextRequest) => {
  const redirect = redirectProtectedRoute(req);
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, req.url))
  }
  return NextResponse.next();
};

// Run the middleware only on paths that require authentication
export const config = {
  matcher: [
    '/intro',
    '/reservation/:path*',
    '/reservations/:path*',
    '/applications/:path*',
    '/application/:path*',
    '/success',
  ],
};
