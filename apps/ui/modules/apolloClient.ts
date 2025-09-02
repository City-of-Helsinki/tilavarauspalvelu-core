import { ApolloClient, HttpLink, InMemoryCache, from, disableFragmentWarnings } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { type ParsedUrlQuery } from "querystring";
import { type GetServerSidePropsContext, type PreviewData } from "next";
import { buildGraphQLUrl } from "common/src/urlBuilder";
import { env } from "@/env.mjs";
import { isBrowser } from "./const";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { enchancedFetch, errorLink } from "common/src/apolloUtils";

// graphql-codegen does not allow fragments with non unique names
// -> this is not needed but it has false positives due to codegen
disableFragmentWarnings();

if (process.env.NODE_ENV === "development") {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export function createApolloClient(hostUrl: string, ctx?: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) {
  const isServer = typeof window === "undefined";
  const uri = buildGraphQLUrl(hostUrl, env.ENABLE_FETCH_HACK);
  const httpLink = new HttpLink({
    uri,
    // TODO this might be useless
    credentials: "include",
    fetch: enchancedFetch(ctx?.req),
  });

  return new ApolloClient({
    ssrMode: isServer,
    link: from([errorLink, httpLink]),
    defaultOptions: {
      query: {
        fetchPolicy: isBrowser ? "cache-first" : "no-cache",
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
