import { useCurrentUserQuery } from "@gql/gql-types";

export function useSession() {
  const { data, error } = useCurrentUserQuery({
    // TODO replace with time based cache policy (and / or refresh silently in background)
    // cache-only for testing
    fetchPolicy: "cache-only",
    // fetchPolicy: "cache-and-network",
    // nextFetchPolicy: "cache-first",
  });
  const user = data?.currentUser ?? null;

  return { isAuthenticated: user != null, user, error };
}
