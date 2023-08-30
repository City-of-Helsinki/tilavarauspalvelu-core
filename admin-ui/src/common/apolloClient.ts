import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { uniqBy } from "lodash";
import { getSession, signOut } from "next-auth/react";
import { GraphQLError } from "graphql/error/GraphQLError";
import { ReservationTypeConnection } from "common/types/gql-types";

import { SESSION_EXPIRED_ERROR, apiBaseUrl, isBrowser } from "./const";
import { CustomFormData } from "./CustomFormData";

const uri = `${apiBaseUrl}/graphql/`;
const uploadLinkOptions = {
  uri,
  FormData: CustomFormData,
};

// FIXME upload link is broken locally (it succeeds but no new image is available)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error FIXME
const uploadLink = createUploadLink(uploadLinkOptions);
const httpLink = new HttpLink({ uri });

const authLink = setContext(async (_request, previousContext) => {
  const headers = previousContext.headers ?? {};
  const session = await getSession();

  return {
    headers: {
      ...headers,
      authorization: session?.apiTokens?.tilavaraus
        ? `Bearer ${session.apiTokens.tilavaraus}`
        : "",
    },
  };
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
      signOut();
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
  link: isBrowser ? from([errorLink, authLink, uploadLink]) : from([httpLink]),
  ssrMode: !isBrowser,
});

export default client;
