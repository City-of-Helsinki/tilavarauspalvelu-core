import { Query, UserType } from "common/types/gql-types";
import { ApolloError, useQuery } from "@apollo/client";
import { CURRENT_USER } from "@/modules/queries/user";

export const useCurrentUser = (): {
  currentUser?: UserType;
  error: ApolloError | undefined;
  loading: boolean;
} => {
  const { data, error, previousData, loading } = useQuery<Query>(CURRENT_USER, {
    fetchPolicy: "network-only",
  });

  return {
    currentUser: data?.currentUser ?? previousData?.currentUser ?? undefined,
    error,
    loading,
  };
};
