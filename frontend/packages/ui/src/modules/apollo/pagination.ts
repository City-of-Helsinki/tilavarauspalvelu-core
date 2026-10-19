import type { FieldPolicy, Reference, StoreObject } from "@apollo/client";

const PAGING_ARGS = new Set(["first", "last", "after", "before"]);

/* Cache key for relayStylePagination. Store a separate list for each set of filters and ordering.
 * The default keyArgs of relayStylePagination is false, so all queries on a field share one list.
 * Then a query with other filters returns the list of the previous query from the cache.
 */
export function keyArgsWithoutPaging(args: Record<string, unknown> | null): string[] | false {
  const keys = Object.keys(args ?? {}).filter((key) => !PAGING_ARGS.has(key));
  return keys.length > 0 ? keys : false;
}

type Connection = {
  edges?: ReadonlyArray<StoreObject | Reference>;
  pageInfo?: { endCursor?: string | null; hasNextPage?: boolean };
};

/* Keep the pages that fetchMore loaded when the first page is fetched again.
 * A list fetches the first page again on mount (cache-and-network). relayStylePagination then replaces
 * all edges with the first page, so after navigating back only the first page is visible.
 * If the first page has the same nodes in the same order as the cached list, keep the cached pages after it.
 * If not, the list has changed, so show only the new first page.
 * Don't use for lists that are polled to see changes made by other users, because the later pages are not refetched.
 */
export function keepLoadedPages(policy: FieldPolicy): FieldPolicy {
  return {
    ...policy,
    merge(existing: Connection | undefined, incoming: Connection | undefined, options) {
      const merged: Connection | undefined =
        typeof policy.merge === "function" ? policy.merge(existing, incoming, options) : incoming;
      const { args, readField } = options;
      const isFirstPage = args?.after == null && args?.before == null;
      const existingEdges = existing?.edges ?? [];
      const incomingEdges = incoming?.edges ?? [];
      if (!isFirstPage || merged == null || incomingEdges.length === 0) {
        return merged;
      }
      if (existingEdges.length <= incomingEdges.length) {
        return merged;
      }
      const isSameFirstPage = incomingEdges.every((edge, i) => {
        const node = readField<Reference>("node", edge);
        const existingNode = readField<Reference>("node", existingEdges[i]);
        return node != null && existingNode != null && node.__ref === existingNode.__ref;
      });
      if (!isSameFirstPage) {
        return merged;
      }
      return {
        ...merged,
        edges: [...(merged.edges ?? []), ...existingEdges.slice(incomingEdges.length)],
        pageInfo: {
          ...merged.pageInfo,
          endCursor: existing?.pageInfo?.endCursor,
          hasNextPage: existing?.pageInfo?.hasNextPage,
        },
      };
    },
  };
}
