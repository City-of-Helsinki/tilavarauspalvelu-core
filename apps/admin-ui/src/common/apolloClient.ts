import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { onError } from "@apollo/client/link/error";
import { uniqBy } from "lodash";
import { GraphQLError } from "graphql/error/GraphQLError";
import type {
  ReservationTypeConnection,
  BannerNotificationTypeConnection,
} from "common/types/gql-types";

import { SESSION_EXPIRED_ERROR, GRAPQL_API_URL, isBrowser } from "./const";
import { CustomFormData } from "./CustomFormData";

const uri = GRAPQL_API_URL;
const uploadLinkOptions = {
  uri,
  credentials: "include",
  FormData: CustomFormData,
};

// NOTE upload link typing is broken when updating apollo to 3.8
// FIXME upload link is broken locally (it succeeds but no new image is available)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error FIXME
const uploadLink = createUploadLink(uploadLinkOptions) as unknown as ApolloLink;
const httpLink = new HttpLink({
  uri,
  credentials: "include",
});

// eslint-disable-next-line consistent-return
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    const isSessionExpired = graphQLErrors.some((error) =>
      error.message.includes(SESSION_EXPIRED_ERROR)
    );

    if (isSessionExpired) {
      // eslint-disable-next-line no-console
      console.warn("Session expired, signing out");
    }

    graphQLErrors.forEach(async (error: GraphQLError) => {
      // eslint-disable-next-line no-console
      console.error(`GQL_ERROR: ${error.message}`);
    });
  }

  if (networkError) {
    // eslint-disable-next-line no-console
    console.error(`NETWORK_ERROR: ${networkError.message}`);
  }
});

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          bannerNotifications: {
            keyArgs: ["orderBy"],
            read(existing: BannerNotificationTypeConnection) {
              return existing;
            },
            merge(
              existing: BannerNotificationTypeConnection,
              incoming: BannerNotificationTypeConnection
            ) {
              // TODO this should be optimized; using both spread and uniqBy creates a lot of copies
              const merged = {
                ...existing,
                ...incoming,
                edges: uniqBy(
                  [...(existing?.edges ?? []), ...incoming.edges],
                  (x) => x?.node?.pk
                ),
              };
              return merged;
            },
          },
          reservations: {
            // Separate caches for all query params
            // causes a full refetch when anything changes which is bad (e.g. sorting)
            // but otherwise we get weird UI behaviour: "Load more" button loads
            // new elements into positions 20 - 40 while it's own position is after 200+ list elements
            // primary usecase is that recurringReservation loading 2000 reservations needs to be cached
            // added benefit is that it allows fast swapping between the same query param values
            keyArgs: [
              "recurringReservation",
              "unit",
              "state",
              "orderBy",
              "reservationUnitType",
              "reservationUnit",
              "textSearch",
              "begin",
              "end",
              "priceGte",
              "priceLte",
              "orderStatus",
            ],
            read(existing: ReservationTypeConnection) {
              return existing;
            },
            merge(
              existing: ReservationTypeConnection,
              incoming: ReservationTypeConnection
            ) {
              // TODO this should be optimized using both spread and uniqBy creates a lot of copies
              return {
                ...incoming,
                edges: uniqBy(
                  [...(existing?.edges ?? []), ...incoming.edges],
                  (x) => x?.node?.pk
                ),
              };
            },
          },
        },
      },
    },
  }),
  link: isBrowser ? from([errorLink, uploadLink]) : from([errorLink, httpLink]),
  ssrMode: !isBrowser,
});

export default client;
