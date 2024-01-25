import { useCurrentUser } from "../user";

export { signIn, signOut } from "common/src/browserHelpers";

export function useSession() {
  const { currentUser, loading, error } = useCurrentUser();
  const isAuthenticated = currentUser != null;
  return { isAuthenticated, user: currentUser, loading, error };
}
