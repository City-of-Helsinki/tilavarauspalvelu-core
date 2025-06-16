import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from "@apollo/client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- types require nodenext which breaks bundler option that breaks the build
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { getCookie } from "typescript-cookie";
import { buildGraphQLUrl } from "common/src/urlBuilder";
import { env } from "@/env.mjs";
import { isBrowser } from "./const";
import { relayStylePagination } from "@apollo/client/utilities";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { errorLink } from "common/src/apolloUtils";

if (process.env.NODE_ENV !== "production") {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

const authLink = new ApolloLink((operation, forward) => {
  // TODO this doesn't work with SSR (use the ui implementation when we add SSR requests)
  if (!isBrowser) {
    throw new Error("authLink doesn't work with SSR");
  }
  const csrfToken = getCookie("csrftoken");

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(csrfToken != null ? { "X-Csrftoken": csrfToken } : {}),
    },
  }));

  return forward(operation);
});

export function createClient(apiBaseUrl: string) {
  const uri = buildGraphQLUrl(apiBaseUrl, env.ENABLE_FETCH_HACK);
  const uploadLinkOptions = {
    uri,
    credentials: "include",
  };

  // TODO replace most of this code with the one in ui (that includes server context)
  // why isn't it done yet? because this uses UploadLink and it uses plain HttpLink
  // and SSR isn't used on admin side so it's not a priority

  // NOTE upload link typing is broken when updating apollo to 3.8
  // FIXME upload link is broken locally (it succeeds but no new image is available)
  const uploadLink: ApolloLink = createUploadLink(uploadLinkOptions);
  const httpLink = new HttpLink({ uri, credentials: "include" });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            reservationUnits: relayStylePagination(),
            units: relayStylePagination(),
            reservations: relayStylePagination(),
            applications: relayStylePagination(),
            applicationSections: relayStylePagination(),
            allocatedTimeSlots: relayStylePagination(),
            bannerNotifications: relayStylePagination(),
            rejectedOccurrences: relayStylePagination(),
          },
        },
      },
    }),
    link: isBrowser ? from([authLink, errorLink, uploadLink]) : from([authLink, errorLink, httpLink]),
    ssrMode: !isBrowser,
  });
}
