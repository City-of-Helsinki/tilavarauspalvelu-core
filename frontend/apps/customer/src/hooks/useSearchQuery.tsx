import { useSearchReservationUnitsQuery } from "@gql/gql-types";
import type { SearchReservationUnitsQueryVariables } from "@gql/gql-types";
import { SEARCH_PAGING_LIMIT } from "@/modules/const";

/* Wrap the search query with a custom hook
 * because we can't trust the query.loading nor totalCount nor hasNextPage
 * we have to provide our own loading state and hasMoreData state
 */
export function useSearchQuery(variables: SearchReservationUnitsQueryVariables) {
  const query = useSearchReservationUnitsQuery({
    variables,
    notifyOnNetworkStatusChange: true,
  });

  const { fetchMore } = query;

  const edgeLength = query.data?.reservationUnits?.edges.length;
  const endReached = edgeLength == null || edgeLength < SEARCH_PAGING_LIMIT;
  const hasMoreData = !endReached;

  // NOTE fetchMore doesn't update the pageInfo cache if the result is empty
  // so we need to track if we have hit the end of the list.
  // A hack around an issue that the backend doesn't know the totalCount of the list
  // i.e. hasNextPage and totalCount are not reliable.
  const handleFetchMore = async (endCursor: string) => {
    const res = await fetchMore({
      variables: {
        ...variables,
        after: endCursor,
      },
    });
    return res;
  };

  // If the last query doesn't return any data the loading state will be stuck
  const isLoading = query.loading && hasMoreData;

  return {
    ...query,
    isLoading,
    fetchMore: handleFetchMore,
    hasMoreData,
  };
}
