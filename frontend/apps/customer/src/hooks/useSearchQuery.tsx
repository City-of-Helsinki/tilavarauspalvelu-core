import { useSearchReservationUnitsQuery } from "@gql/gql-types";
import type { SearchReservationUnitsQueryVariables } from "@gql/gql-types";

/* Wrap the search query with a custom hook to page with the current variables.
 * hasNextPage is set in the Apollo cache policy, because the backend value is not reliable.
 */
export function useSearchQuery(variables: SearchReservationUnitsQueryVariables) {
  const query = useSearchReservationUnitsQuery({
    variables,
    notifyOnNetworkStatusChange: true,
  });

  const { fetchMore } = query;

  const handleFetchMore = (endCursor: string) => {
    return fetchMore({
      variables: {
        ...variables,
        after: endCursor,
      },
    });
  };

  return {
    ...query,
    isLoading: query.loading,
    fetchMore: handleFetchMore,
    hasMoreData: query.data?.reservationUnits?.pageInfo.hasNextPage ?? false,
  };
}
