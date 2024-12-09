import { useCurrentUserQuery, type CurrentUserQuery } from "@gql/gql-types";
import { type ApolloError } from "@apollo/client";

// TODO this should be replaced with SSR current user in most cases.
// Causes a flash of unauthenticated content on page load.
export function useCurrentUser(): {
  currentUser?: CurrentUserQuery["currentUser"] | undefined;
  error: ApolloError | undefined;
  loading: boolean;
} {
  const { data, error, previousData, loading } = useCurrentUserQuery({
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const currentUser =
    data?.currentUser ?? previousData?.currentUser ?? undefined;
  return {
    currentUser,
    error,
    loading,
  };
}
