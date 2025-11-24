import type { IncomingMessage } from "node:http";
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, NormalizedCacheObject, from } from "@apollo/client";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { relayStylePagination } from "@apollo/client/utilities";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- types require nodenext which breaks bundler option that breaks the build
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { enchancedFetch, errorLink } from "ui/src/modules/apolloUtils";
import { buildGraphQLUrl } from "ui/src/modules/urlBuilder";
import { isBrowser } from "./const";

if (process.env.NODE_ENV !== "production") {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export function createClient(hostUrl: string, req?: IncomingMessage): ApolloClient<NormalizedCacheObject> {
  const isServer = typeof window === "undefined";
  const uri = buildGraphQLUrl(hostUrl);
  const uploadLinkOptions = {
    uri,
    credentials: "include",
    fetch: enchancedFetch(req),
  };

  const uploadLink: ApolloLink = createUploadLink(uploadLinkOptions);
  const httpLink = new HttpLink({
    uri,
    // TODO this might be useless
    credentials: "include",
    fetch: enchancedFetch(req),
  });

  return new ApolloClient({
    ssrMode: isServer,
    link: isServer ? from([errorLink, httpLink]) : from([errorLink, uploadLink]),
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
            units: relayStylePagination(),
            reservations: relayStylePagination(["onlyWithHandlingPermission"]),
            applications: relayStylePagination(),
            applicationSections: relayStylePagination(),
            allocatedTimeSlots: relayStylePagination(),
            bannerNotifications: relayStylePagination(["target"]),
            rejectedOccurrences: relayStylePagination(),
          },
        },
      },
    }),
  });
}
