import { useCurrentUser } from "..";

// TODO this should be removed because we have middleware for the check.
// This causes a flash of unauthenticated content on page load even though the user is authenticated.
export function useSession() {
  const { currentUser, loading, error } = useCurrentUser();
  const isAuthenticated = currentUser != null;
  return { isAuthenticated, user: currentUser, loading, error };
}
