import { useQuery } from "@apollo/client";
import type { Query, QueryApplicationArgs } from "common/types/gql-types";
import { APPLICATION_QUERY } from "common/src/queries/application";
import { base64encode } from "common/src/helpers";

export const useApplicationQuery = (pk?: number) => {
  const typename = "ApplicationNode";
  const id = base64encode(`${typename}:${pk}`);
  const { data, error, loading } = useQuery<Query, QueryApplicationArgs>(
    APPLICATION_QUERY,
    {
      variables: {
        id,
      },
      skip: !pk,
    }
  );

  return {
    application: data?.application ?? null,
    error,
    isLoading: loading,
  };
};
