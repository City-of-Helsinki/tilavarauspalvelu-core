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

// Run the middleware only on paths that require authentication
// NOTE don't define nested routes, only single word top level routes are supported
// refactor the matcher or fix the underlining matcher issue in nextjs
// matcher syntax: /hard-path/:path* -> /hard-path/anything
// our syntax: hard-path
const authenticatedRoutes = [
  'intro',
  'reservation', //:path*',
  'reservations', //:path*',
  'applications', //:path*',
  'application', //:path*',
  'success',
];
// ugly url matcher that is very specific to our case
const doesUrlMatch = (url: string, route: string) => {
  const ref: string[] = url.split('/') // ?.[1]?.split('/')?.[0]
  return ref.includes(route)
}
export const middleware = async (req: NextRequest) => {
  if (authenticatedRoutes.some(route => doesUrlMatch(req.url, route))) {
    // eslint-disable-next-line no-console -- debug stuff
    console.log('middleware', req.url)
    // eslint-disable-next-line no-console -- debug stuff
    console.log('headers: ', req.headers)
    const redirect = redirectProtectedRoute(req);
    if (redirect) {
      // eslint-disable-next-line no-console -- debug stuff
      console.log('redirecting to: ', redirect)
      return NextResponse.redirect(new URL(redirect, req.url))
    }
  } else {
    // eslint-disable-next-line no-console -- debug stuff
    console.log('middleware NOT run: ', req.url)
  }
  return NextResponse.next();
};

export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
};
