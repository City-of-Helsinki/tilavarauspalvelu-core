import { setCookie } from "typescript-cookie";
import { signOut } from "ui/src/modules/browserHelpers";
import { AUTHENTICATED_ROUTES, doesUrlMatch } from "./urls";

export const LOGOUT_RETURN_PATH_COOKIE = "logoutReturnPath";

// 10 minutes, in days
const RETURN_PATH_COOKIE_EXPIRES = 10 / (24 * 60);

// Any fixed origin works. Only the path and query of the parsed URL are used.
const POST_LOGOUT_BASE_URL = "http://localhost";

/// Sign the user out and return to the current page after the logout.
/// The return path goes in a cookie and not in the logout redirect URL.
/// Keycloak accepts only the registered logout redirect URL, which is /auth/logout/.
/// Throws if called on the server
export function signOutToCurrentPage(): void {
  const { pathname, search } = window.location;
  setCookie(LOGOUT_RETURN_PATH_COOKIE, `${pathname}${search}`, {
    path: "/",
    sameSite: "lax",
    expires: RETURN_PATH_COOKIE_EXPIRES,
  });
  signOut();
}

/// @param returnPath - the path that signOutToCurrentPage saved, or undefined
/// @return the path to go to after the logout.
/// A page that requires authentication gives the front page in the same language.
export function getPostLogoutPath(returnPath: string | undefined): string {
  if (returnPath == null) {
    return "/";
  }
  // Accept only a path on this site, so the cookie cannot send the user to another site.
  // The URL parser removes tabs and newlines and reads a backslash as a slash, as a browser does.
  const url = URL.parse(returnPath, POST_LOGOUT_BASE_URL);
  if (url == null || url.origin !== POST_LOGOUT_BASE_URL) {
    return "/";
  }
  const { pathname, search } = url;
  if (AUTHENTICATED_ROUTES.some((route) => doesUrlMatch(pathname, route))) {
    const lang = pathname.match(/^\/(en|sv)(\/|$)/)?.[1];
    return lang != null ? `/${lang}` : "/";
  }
  return `${pathname}${search}`;
}
