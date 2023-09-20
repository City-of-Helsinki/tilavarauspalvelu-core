import { Query, UserType } from "common/types/gql-types";
import { ApolloError, useQuery } from "@apollo/client";
import { CURRENT_USER, CURRENT_USER_GLOBAL } from "../modules/queries/user";

export const useCurrentUser = ({
  global = false,
}: { global?: boolean } = { global: false }): {
  currentUser?: UserType;
  error: ApolloError | undefined;
  loading: boolean;
} => {
  const query = global ? CURRENT_USER_GLOBAL : CURRENT_USER;
  const { data, error, loading } = useQuery<Query>(query, {
    fetchPolicy: "no-cache",
    /* TODO what's the purpose of this?
    context: {
      ...(isBrowser ? {
        headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "x-referrer": window?.location?.href,
      },
      }: {}),
    },
    */
  });

  return {
    currentUser: data?.currentUser ?? undefined,
    error,
    loading,
  };
};
