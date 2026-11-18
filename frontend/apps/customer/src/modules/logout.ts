import { setCookie } from "typescript-cookie";
import { signOut } from "ui/src/modules/browserHelpers";
import { AUTHENTICATED_ROUTES, doesUrlMatch } from "./urls";

export const LOGOUT_RETURN_PATH_COOKIE = "logoutReturnPath";

// 10 minutes, in days
const RETURN_PATH_COOKIE_EXPIRES = 10 / (24 * 60);

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
  // Accept only a path on this site, so the cookie cannot send the user to another site
  if (returnPath == null || !returnPath.startsWith("/") || returnPath.startsWith("//") || returnPath.includes("\\")) {
    return "/";
  }
  const pathname = returnPath.split("?")[0] ?? "";
  if (AUTHENTICATED_ROUTES.some((route) => doesUrlMatch(pathname, route))) {
    const lang = pathname.match(/^\/(en|sv)(\/|$)/)?.[1];
    return lang != null ? `/${lang}` : "/";
  }
  return returnPath;
}
