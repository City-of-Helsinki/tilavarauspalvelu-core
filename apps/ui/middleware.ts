import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// import { getSignInUrl } from "@/modules/const";
// import { authEnabled } from "@/modules/const";

const authEnabled = true;

// TODO this is duplicate from const.ts
// rewrite this so it doesn't rely on next:config (that isn't available in middleware)
// but can still be used elsewhere
const API_BASE_URL = process.env.NEXT_PUBLIC_TILAVARAUS_API_URL;
const AUTH_URL = API_BASE_URL != null ? `${API_BASE_URL}/helauth` : "/helauth";
const PUBLIC_URL: string = "";

const getCleanPublicUrl = () => {
  const hasPublicUrl =
    PUBLIC_URL != null && PUBLIC_URL !== "/" && PUBLIC_URL !== "";
  const publicUrlNoSlash =
    PUBLIC_URL && hasPublicUrl ? PUBLIC_URL.replace(/\/$/, "") : "";
  const cleanPublicUrl = publicUrlNoSlash.startsWith("/")
    ? publicUrlNoSlash
    : `/${publicUrlNoSlash}`;
  return cleanPublicUrl;
}
export const getSignInUrl = (callBackUrl: string): string => {
  if (callBackUrl.includes(`/logout`)) {
    const baseUrl = new URL(callBackUrl).origin;
    const cleanPublicUrl = getCleanPublicUrl();
    return `${AUTH_URL}/login?next=${baseUrl}${cleanPublicUrl}`;
  }
  return `${AUTH_URL}/login?next=${callBackUrl}`;
};

function redirectProtectedRoute (req: NextRequest) {
  if (!authEnabled) {
    return undefined
  }
  // TODO check that the cookies is valid not just present
  const { cookies } = req
  const hasSession = cookies.has('sessionid');
  if (!hasSession) {
    console.log('redirecting to login');
    const currentUrl = req.url
    console.log(`currentUrl: ${currentUrl}`);
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
