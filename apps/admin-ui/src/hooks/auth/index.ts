import { useQuery } from "@apollo/client";
import { type Query } from "common/types/gql-types";
import { CURRENT_USER } from "app/context/queries";
import { getSignOutUrl, getSignInUrl, isBrowser } from "@/common/const";

// TODO move to packages/common (except for the session hook, because it uses different queries in different apps)
// move useSession to hooks/useSession.ts
// TODO add wrapper a that blocks importing on nodejs

/// Redirect the user to the sign in dialog and return to the current url after sign in
/// Thows if called on the server
export function signIn() {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  const currentUrl = window.location.href;
  const url = getSignInUrl("", currentUrl);
  window.location.href = url;
}

/// Log the user out and redirect to route /logout
/// Thows if called on the server
export function signOut() {
  if (!isBrowser) {
    throw new Error("signOut can only be called in the browser");
  }
  window.location.href = getSignOutUrl("");
}

export function useSession() {
  const { data, error } = useQuery<Query>(CURRENT_USER);
  const user = data?.currentUser ?? undefined;

  return { isAuthenticated: user != null, user, error };
}
