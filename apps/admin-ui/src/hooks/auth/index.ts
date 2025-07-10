import { useCurrentUserQuery } from "@gql/gql-types";

export function useSession() {
  const { data, error } = useCurrentUserQuery({
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const user = data?.currentUser ?? null;

  return { isAuthenticated: user != null, user, error };
}
