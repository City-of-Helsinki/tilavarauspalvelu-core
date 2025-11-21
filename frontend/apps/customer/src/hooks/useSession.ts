import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook that provides session authentication state
 * @deprecated This should be removed because we have middleware for the check
 * @returns Object containing isAuthenticated flag, user data, loading state, and error
 * @note Causes a flash of unauthenticated content on page load even though the user is authenticated
 */
export function useSession() {
  const { currentUser, loading, error } = useCurrentUser();
  const isAuthenticated = currentUser != null;
  return { isAuthenticated, user: currentUser, loading, error };
}
