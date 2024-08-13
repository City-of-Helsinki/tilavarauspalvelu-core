import { useCurrentUserQuery } from "@gql/gql-types";

export function useSession() {
  const { data, error } = useCurrentUserQuery();
  const user = data?.currentUser ?? undefined;

  return { isAuthenticated: user != null, user, error };
}
