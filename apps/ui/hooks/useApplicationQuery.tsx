import { useQuery } from "@apollo/client";
import type { Query, QueryApplicationsArgs } from "common/types/gql-types";
import { APPLICATION_QUERY } from "common/src/queries/application";

export const useApplicationQuery = (pk?: number) => {
  const { data, error, loading } = useQuery<Query, QueryApplicationsArgs>(APPLICATION_QUERY, {
    variables: {
      pk: [pk ?? 0],
    },
    skip: !pk,
  });

  return {
    application: data?.applications?.edges[0]?.node,
    error,
    isLoading: loading,
  };
}
