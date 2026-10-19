import type { GetServerSidePropsContext } from "next";
import { ApolloClient, from, HttpLink, InMemoryCache } from "@apollo/client";
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import { relayStylePagination } from "@apollo/client/utilities";
import type { FieldPolicy } from "@apollo/client";
import { enchancedFetch, errorLink } from "@ui/modules/apollo/helpers";
import { keepLoadedPages, keyArgsWithoutPaging } from "@ui/modules/apollo/pagination";
import { SentryContextLink } from "@ui/modules/apollo/sentryLink";
import { buildGraphQLUrl } from "@ui/modules/urlBuilder";

/* The backend can't tell if a next page exists. It filters by reservability after paging,
 * so hasNextPage and totalCount are not reliable.
 * Mark the end of the list in the cache when a page is not full.
 * This also changes the cache when fetchMore returns no edges,
 * so the query leaves the loading state.
 */
function reservationUnitPagination(): FieldPolicy {
  const policy = relayStylePagination(keyArgsWithoutPaging);
  return {
    ...policy,
    merge(existing, incoming, options) {
      if (typeof policy.merge !== "function") {
        return incoming;
      }
      const merged = policy.merge(existing, incoming, options);
      const first: unknown = options.args?.first;
      if (typeof first !== "number" || merged == null) {
        return merged;
      }
      const pageLength = incoming?.edges?.length ?? 0;
      return {
        ...merged,
        pageInfo: { ...merged.pageInfo, hasNextPage: pageLength >= first },
      };
    },
  };
}

if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

export function createApolloClient(hostUrl: string, ctx?: GetServerSidePropsContext) {
  const isServer = typeof window === "undefined";
  const uri = buildGraphQLUrl(hostUrl);
  const httpLink = new HttpLink({
    uri,
    credentials: "include",
    fetch: enchancedFetch(ctx?.req),
  });

  const sentryLink = new SentryContextLink();

  return new ApolloClient({
    ssrMode: isServer,
    link: from([sentryLink, errorLink, httpLink]),
    defaultOptions: {
      query: {
        fetchPolicy: isServer ? "no-cache" : "cache-first",
      },
      // The client lives for the whole session, so fetch on mount to not show old data from an earlier page
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
    },
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            reservationUnits: keepLoadedPages(reservationUnitPagination()),
          },
        },
      },
    }),
  });
}
