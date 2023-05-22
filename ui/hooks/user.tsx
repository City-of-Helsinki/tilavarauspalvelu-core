import { Query, UserType } from "common/types/gql-types";
import { ApolloError, useQuery } from "@apollo/client";
import { CURRENT_USER, CURRENT_USER_GLOBAL } from "../modules/queries/user";

type Props = {
  global?: boolean;
};

export const useCurrentUser = ({
  global,
}: Props): {
  currentUser: UserType | null;
  error: ApolloError;
  loading: boolean;
} => {
  const query = global ? CURRENT_USER_GLOBAL : CURRENT_USER;
  const { data, error, loading } = useQuery<Query>(query, {
    fetchPolicy: "no-cache",
    context: {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "x-referrer": window?.location?.href,
      },
    },
  });

  return {
    currentUser: data?.currentUser,
    error,
    loading,
  };
};
