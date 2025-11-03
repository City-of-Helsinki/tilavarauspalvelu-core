import { useEffect } from "react";
import { useCurrentUserQuery } from "@gql/gql-types";

const POLLING_INTERVAL = 60 * 1000; // 1 minute

// Testing use of manual polling / refetching with current user query.
// problem with Apollo hooks is that nextjs reruns all hooks on query param change.
export function useSession() {
  const { data, error, refetch } = useCurrentUserQuery({
    // SSR query is written to cache
    fetchPolicy: "cache-only",
    // Disable updates on hook remounts
    nextFetchPolicy: "standby",
  });

  // setup polling
  useEffect(() => {
    const id = setInterval(() => {
      refetch();
    }, POLLING_INTERVAL);
    return () => clearTimeout(id);
  }, [refetch]);

  const user = data?.currentUser ?? null;

  return { isAuthenticated: user != null, user, error };
}
