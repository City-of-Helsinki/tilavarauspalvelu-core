import { type SearchReservationUnitsQueryVariables, useSearchReservationUnitsQuery } from "@/gql/gql-types";
import { SEARCH_PAGING_LIMIT } from "@/modules/const";
import { hash, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/* Wrap the search query with a custom hook
 * because we can't trust the query.loading nor totalCount nor hasNextPage
 * we have to provide our own loading state and hasMoreData state
 */
export function useSearchQuery(variables: SearchReservationUnitsQueryVariables) {
  const query = useSearchReservationUnitsQuery({
    variables,
    notifyOnNetworkStatusChange: true,
  });

  const [hasMoreData, setHasMoreData] = useState(true);
  const [varhash, setVarhash] = useState("");
  const { fetchMore } = query;

  const router = useRouter();

  // clear the showMore state if the variables change
  useEffect(() => {
    async function check(v: typeof variables, version: number): Promise<void> {
      // use hash to make sure we don't reset unnecessarily
      const hashed = await hash(JSON.stringify({ ...v, version }));
      if (hashed !== varhash) {
        setVarhash(hashed);
        setHasMoreData(true);
      }
    }

    const { ref } = router.query;
    const version = toNumber(ignoreMaybeArray(ref));
    check(variables, version ?? 0);
  }, [variables, varhash, router.query]);

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
