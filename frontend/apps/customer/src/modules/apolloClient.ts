import { ApolloClient, from, HttpLink, InMemoryCache } from "@apollo/client";
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import { relayStylePagination } from "@apollo/client/utilities";
import type { GetServerSidePropsContext } from "next";
import { enchancedFetch, errorLink } from "ui/src/modules/apolloUtils";
import { buildGraphQLUrl } from "ui/src/modules/urlBuilder";
import { SentryContextLink } from "@ui/modules/apollo/sentryLink";

if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

export function createApolloClient(hostUrl: string, ctx?: GetServerSidePropsContext) {
  const isServer = typeof window === "undefined";
  const uri = buildGraphQLUrl(hostUrl);
  const httpLink = new HttpLink({
    uri,
    // TODO this might be useless
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
    },
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            reservationUnits: relayStylePagination(),
          },
        },
      },
    }),
  });
}
