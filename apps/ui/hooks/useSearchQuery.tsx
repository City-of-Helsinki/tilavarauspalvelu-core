import {
  type SearchReservationUnitsQueryVariables,
  useSearchReservationUnitsQuery,
} from "@/gql/gql-types";
import { SEARCH_PAGING_LIMIT } from "@/modules/const";
import { hash } from "common/src/helpers";
import { useEffect, useState } from "react";

/* Wrap the search query with a custom hook
 * because we can't trust the query.loading nor totalCount nor hasNextPage
 * we have to provide our own loading state and hasMoreData state
 */
export function useSearchQuery(
  variables: SearchReservationUnitsQueryVariables
) {
  // TODO should really hydrate the ApolloClient from SSR
  const query = useSearchReservationUnitsQuery({
    variables,
    fetchPolicy: "network-only",
    // Why?
    // skip: Object.keys(searchValues).length === 0,
    notifyOnNetworkStatusChange: true,
    onError: (error1) =>
      // eslint-disable-next-line no-console
      console.warn(error1, variables, "error in search query"),
  });

  const [hasMoreData, setHasMoreData] = useState(true);
  const [varhash, setVarhash] = useState("");
  const { fetchMore } = query;

  // clear the showMore state if the variables change
  useEffect(() => {
    function check(v: typeof variables): void {
      // use hash to make sure we don't reset unnecessarily
      hash(JSON.stringify(v)).then((h) => {
        if (h !== varhash) {
          setVarhash(h);
          setHasMoreData(true);
        }
      });
    }

    check(variables);
  }, [variables, varhash]);

  useEffect(() => {
    if (query.data) {
      const edgeLength = query.data.reservationUnits?.edges.length;
      if (!edgeLength || edgeLength === 0 || edgeLength < SEARCH_PAGING_LIMIT) {
        setHasMoreData(false);
      }
    }
  }, [query.data]);

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
    const edgeLength = res.data.reservationUnits?.edges.length;

    if (!edgeLength || edgeLength === 0 || edgeLength < SEARCH_PAGING_LIMIT) {
      setHasMoreData(false);
    }
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
