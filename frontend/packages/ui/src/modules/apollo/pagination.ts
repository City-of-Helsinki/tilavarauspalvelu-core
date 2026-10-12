const PAGING_ARGS = new Set(["first", "last", "after", "before"]);

/* Cache key for relayStylePagination. Store a separate list for each set of filters and ordering.
 * The default keyArgs of relayStylePagination is false, so all queries on a field share one list.
 * Then a query with other filters returns the list of the previous query from the cache.
 */
export function keyArgsWithoutPaging(args: Record<string, unknown> | null): string[] | false {
  const keys = Object.keys(args ?? {}).filter((key) => !PAGING_ARGS.has(key));
  return keys.length > 0 ? keys : false;
}
