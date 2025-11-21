import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { hash, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { SEARCH_PAGING_LIMIT } from "@/modules/const";
import { useSearchReservationUnitsQuery } from "@gql/gql-types";
import type { SearchReservationUnitsQueryVariables } from "@gql/gql-types";

/**
 * Hook that wraps the search query with custom loading and pagination state
 * Provides reliable loading and hasMoreData states that can't be trusted from Apollo
 * Resets pagination state when search variables change
 * @param variables - Search query variables including filters, sorting, and pagination
 * @returns Query result with custom hasMoreData flag and onLoadMore function
 * @note Can't trust query.loading, totalCount, or hasNextPage from Apollo - we provide our own state
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
