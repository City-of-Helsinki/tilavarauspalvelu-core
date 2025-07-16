import { NextResponse, type NextRequest } from "next/server";

// Remove _components and _test (with either __ or _) from the file router
// eslint-disable-next-line require-await
export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const tmp = url.pathname.match(/.*\/_(?:components?|_?test).*/);
  if (tmp != null && tmp.length > 0) {
    return NextResponse.error(); // 404
  }
  return NextResponse.next();
}

// TODO we could use a matcher here (we don't localise routes in admin ui)
export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
};
