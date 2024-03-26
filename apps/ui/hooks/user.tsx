import type { Query, UserNode } from "common/types/gql-types";
import { type ApolloError, useQuery } from "@apollo/client";
import { CURRENT_USER } from "@/modules/queries/user";

// TODO this should be replaced with SSR current user in most cases.
// Causes a flash of unauthenticated content on page load.
export const useCurrentUser = (): {
  currentUser?: UserNode;
  error: ApolloError | undefined;
  loading: boolean;
} => {
  const { data, error, previousData, loading } = useQuery<Query>(CURRENT_USER, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  return {
    currentUser: data?.currentUser ?? previousData?.currentUser ?? undefined,
    error,
    loading,
  };
};
