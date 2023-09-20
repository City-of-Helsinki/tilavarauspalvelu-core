import { getSignOutUrl , getSignInUrl } from "~/modules/const";
import { useCurrentUser } from "../user";

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

// TODO state things like authenticating and error
// should do a GQL current user query to check if user is authenticated
export function useSession() {
  const { currentUser, loading, error } = useCurrentUser()
  return { isAuthenticated: currentUser != null, user: currentUser, loading, error };
}
