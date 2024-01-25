import { z } from "zod";
import { getSignOutUrl, getSignInUrl, isBrowser } from "~/modules/const";
import { useCurrentUser } from "../user";

/// NOTE have to cleanup because HDS components might be passing event here
function cleanupUrlParam(url: unknown): string | undefined {
  if (typeof url === "string") {
    return z.string().url().parse(url);
  }
  return undefined;
}

// Redirect the user to the sign in dialog and return to returnUrl (or
// current url if none is provided) after sign in
export function signIn(apiBaseUrl: string, returnUrl?: unknown) {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  const returnUrlParam = cleanupUrlParam(returnUrl);
  const returnTo = returnUrlParam ?? window.location.href;
  const url = getSignInUrl(apiBaseUrl, returnTo);
  window.location.href = url;
}

// Log the user out and redirect to route /logout
// TODO need the backend url here
export function signOut(apiBaseUrl: string) {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  window.location.href = getSignOutUrl(apiBaseUrl);
}

export function useSession() {
  const { currentUser, loading, error } = useCurrentUser();
  const isAuthenticated = currentUser != null;
  return { isAuthenticated, user: currentUser, loading, error };
}
