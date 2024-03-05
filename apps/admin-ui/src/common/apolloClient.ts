import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { getCookie } from "typescript-cookie";
import { onError } from "@apollo/client/link/error";
import { uniqBy } from "lodash";
import { GraphQLError } from "graphql/error/GraphQLError";
import type {
  ApplicationNodeConnection,
  ApplicationSectionNodeConnection,
  AllocatedTimeSlotNodeConnection,
  ReservationTypeConnection,
  BannerNotificationNodeConnection,
} from "common/types/gql-types";
import { buildGraphQLUrl } from "common/src/urlBuilder";
import { env } from "@/env.mjs";
import { isBrowser } from "./const";
import { CustomFormData } from "./CustomFormData";

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

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
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

function createClient(apiBaseUrl: string) {
  const uri = buildGraphQLUrl(apiBaseUrl, env.ENABLE_FETCH_HACK);
  const uploadLinkOptions = {
    uri,
    credentials: "include",
    FormData: CustomFormData,
  };

  // TODO replace most of this code with the one in ui (that includes server context)
  // why isn't it done yet? because this uses UploadLink and it uses plain HttpLink
  // and SSR isn't used on admin side so it's not a priority

  // NOTE upload link typing is broken when updating apollo to 3.8
  // FIXME upload link is broken locally (it succeeds but no new image is available)
  // @ts-expect-error FIXME
  const uploadLink: ApolloLink = createUploadLink(uploadLinkOptions);
  const httpLink = new HttpLink({ uri, credentials: "include" });

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          bannerNotifications: {
            keyArgs: ["orderBy"],
            read(existing: BannerNotificationNodeConnection) {
              return existing;
            },
            merge(
              existing: BannerNotificationNodeConnection,
              incoming: BannerNotificationNodeConnection
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
          allocatedTimeSlots: {
            keyArgs: [
              "applicationRound",
              "allocatedUnit",
              "applicantType",
              "applicationSectionStatus",
              "allocatedReservationUnit",
              "dayOfTheWeek",
              "textSearch",
              "orderBy",
            ],
            read(existing: AllocatedTimeSlotNodeConnection) {
              return existing;
            },
            merge(
              existing: AllocatedTimeSlotNodeConnection,
              incoming: AllocatedTimeSlotNodeConnection
            ) {
              return {
                ...incoming,
                edges: uniqBy(
                  [...(existing?.edges ?? []), ...incoming.edges],
                  (x) => x?.node?.pk
                ),
              };
            },
          },
          applicationSections: {
            keyArgs: [
              "applicationRound",
              "applicationStatus",
              "status",
              "unit",
              "applicantType",
              "preferredOrder",
              "textSearch",
              "priority",
              "purpose",
              "reservationUnit",
              "ageGroup",
              "homeCity",
              "includePreferredOrder10OrHigher",
              "orderBy",
            ],
            read(existing: ApplicationSectionNodeConnection) {
              return existing;
            },
            merge(
              existing: ApplicationSectionNodeConnection,
              incoming: ApplicationSectionNodeConnection
            ) {
              return {
                ...incoming,
                edges: uniqBy(
                  [...(existing?.edges ?? []), ...incoming.edges],
                  (x) => x?.node?.pk
                ),
              };
            },
          },
          applications: {
            keyArgs: [
              "orderBy",
              "applicationRound",
              "unit",
              "status",
              "applicantType",
              "textSearch",
            ],
            read(existing: ApplicationNodeConnection) {
              return existing;
            },
            merge(
              existing: ApplicationNodeConnection,
              incoming: ApplicationNodeConnection
            ) {
              return {
                ...incoming,
                edges: uniqBy(
                  [...(existing?.edges ?? []), ...incoming.edges],
                  (x) => x?.node?.pk
                ),
              };
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
              "beginDate",
              "endDate",
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
  });

  return new ApolloClient({
    cache,
    link: isBrowser
      ? from([authLink, errorLink, uploadLink])
      : from([authLink, errorLink, httpLink]),
    ssrMode: !isBrowser,
  });
}

export { createClient };
