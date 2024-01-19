import { z } from "zod";
import { getSignOutUrl, getSignInUrl } from "~/modules/const";
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
export function signIn(returnUrl?: unknown) {
  if (typeof window === "undefined") {
    throw new Error("signIn can only be called in the browser");
  }
  const returnUrlParam = cleanupUrlParam(returnUrl);
  const returnTo = returnUrlParam ?? window.location.href;
  const url = getSignInUrl(returnTo);
  window.location.href = url;
}

// Log the user out and redirect to route /logout
export function signOut() {
  window.location.href = getSignOutUrl();
}

export function useSession() {
  const { currentUser, loading, error } = useCurrentUser();
  const isAuthenticated = currentUser != null;
  return { isAuthenticated, user: currentUser, loading, error };
}
