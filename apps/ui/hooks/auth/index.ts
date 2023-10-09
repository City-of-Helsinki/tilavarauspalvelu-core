import { getSignOutUrl , getSignInUrl } from "~/modules/const";
import { useCurrentUser } from "../user";
import { authEnabled } from "@/modules/const";

  // Redirect the user to the sign in dialog and return to the current url after sign in
export function signIn() {
  const currentUrl = window.location.href;
  const url = getSignInUrl(currentUrl);
  window.location.href = url;
};

// Log the user out and redirect to route /logout
export function signOut() {
  window.location.href = getSignOutUrl();
};

export function useSession() {
  const { currentUser, loading, error } = useCurrentUser()
  const isAuthenticated = !authEnabled || currentUser != null
  return { isAuthenticated, user: currentUser, loading, error };
}
