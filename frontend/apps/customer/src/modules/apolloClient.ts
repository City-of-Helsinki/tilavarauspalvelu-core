import type { GetServerSidePropsContext } from "next";
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import { relayStylePagination } from "@apollo/client/utilities";
import type { FieldPolicy } from "@apollo/client";
import { enchancedFetch, errorLink } from "@ui/modules/apollo/helpers";
import { keepLoadedPages, keyArgsWithoutPaging } from "@ui/modules/apollo/pagination";
import { createRetryLink } from "@ui/modules/apollo/retryLink";
import { SentryContextLink } from "@ui/modules/apollo/sentryLink";
import { buildGraphQLUrl } from "@ui/modules/urlBuilder";
import { env } from "@/env.mjs";

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
    fetch: enchancedFetch(ctx?.req, env.CLIENT_FETCH_TIMEOUT_MS),
  });

  const sentryLink = new SentryContextLink();

  return new ApolloClient({
    ssrMode: isServer,
    link: ApolloLink.from([sentryLink, errorLink, createRetryLink(isServer), httpLink]),
    defaultOptions: {
      query: {
        fetchPolicy: isServer ? "no-cache" : "cache-first",
      },
      watchQuery: {
        // The client lives for the whole session, so fetch on mount to not show old data from an earlier page
        fetchPolicy: "cache-and-network",
        // Apollo Client 4 changed the default to true, keep the Apollo Client 3 behaviour
        notifyOnNetworkStatusChange: false,
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
