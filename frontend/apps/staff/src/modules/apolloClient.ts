import type { IncomingMessage } from "node:http";
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { relayStylePagination } from "@apollo/client/utilities";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- types require nodenext which breaks bundler option that breaks the build
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";
import { enchancedFetch, errorLink } from "@ui/modules/apollo/helpers";
import { keepLoadedPages, keyArgsWithoutPaging } from "@ui/modules/apollo/pagination";
import { SentryContextLink } from "@ui/modules/apollo/sentryLink";
import { buildGraphQLUrl } from "@ui/modules/urlBuilder";
import { env } from "@/env.mjs";

if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

export function createClient(hostUrl: string, req?: IncomingMessage): ApolloClient {
  const isServer = typeof window === "undefined";
  const uri = buildGraphQLUrl(hostUrl);
  const linkOptions: HttpLink.Options = {
    uri,
    credentials: "include",
    fetch: enchancedFetch(req, env.CLIENT_FETCH_TIMEOUT_MS),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- no types, see the import
  const uploadLink: ApolloLink = new UploadHttpLink(linkOptions);
  const sentryLink = new SentryContextLink();
  const httpLink = new HttpLink(linkOptions);

  return new ApolloClient({
    ssrMode: isServer,
    link: ApolloLink.from([sentryLink, errorLink, isServer ? httpLink : uploadLink]),
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
            reservationUnits: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
            units: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
            reservations: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
            applications: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
            // The allocation page polls this field to see the allocations of other staff users, so refetch all pages
            applicationSections: relayStylePagination(keyArgsWithoutPaging),
            allocatedTimeSlots: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
            bannerNotifications: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
            rejectedOccurrences: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
          },
        },
      },
    }),
  });
}
