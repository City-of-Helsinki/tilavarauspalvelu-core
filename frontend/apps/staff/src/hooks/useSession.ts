import { useEffect } from "react";
import { isWindowVisible } from "@ui/modules/browserHelpers";
import { CURRENT_USER_POLL_INTERVAL_MS } from "@/modules/const";
import { useCurrentUserQuery } from "@gql/gql-types";

// Use manual polling
// SSR writes the query result to cache so refetch only after an interval
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
    if (CURRENT_USER_POLL_INTERVAL_MS > 0) {
      const id = setInterval(() => {
        if (isWindowVisible()) {
          refetch();
        }
      }, CURRENT_USER_POLL_INTERVAL_MS);
      return () => clearTimeout(id);
    }
  }, [refetch]);

  const user = data?.currentUser ?? null;

  return { isAuthenticated: user != null, user, error };
}
