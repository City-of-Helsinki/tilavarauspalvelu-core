import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { set, uniqBy } from "lodash";
import { ReservationTypeConnection } from "common/types/gql-types";
import { ExtendedSession } from "../pages/api/auth/[...nextauth]";

// import { getApiAccessToken, updateApiAccessToken } from "./auth/util";
import {
  PROFILE_TOKEN_HEADER,
  SESSION_EXPIRED_ERROR,
  apiBaseUrl,
} from "./const";
import { CustomFormData } from "./CustomFormData";
import { getSession } from "next-auth/react";
import { GraphQLError } from "graphql/error/GraphQLError";

// const getNewToken = () => updateApiAccessToken();

const uploadLinkOptions = {
  uri: `${apiBaseUrl}/graphql/`,
};

set(uploadLinkOptions, "FormData", CustomFormData);

const terminatingLink = createUploadLink(uploadLinkOptions);

const authLink = setContext(
  async (notUsed, { headers }: { headers: Headers }) => {
    const session = (await getSession()) as ExtendedSession;

    const modifiedHeader = {
      headers: {
        ...headers,
        authorization: session?.apiTokens?.tilavaraus
          ? `Bearer ${session.apiTokens.tilavaraus}`
          : "",
        [PROFILE_TOKEN_HEADER]: session?.apiTokens?.profile ?? "",
      },
    };
    return modifiedHeader;
  }
);

// eslint-disable-next-line consistent-return
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    const isSessionExpired = graphQLErrors.some((error) =>
      error.message.includes(SESSION_EXPIRED_ERROR)
    );

    if (isSessionExpired) {
      console.warn("Should sign out here");
      // handleSignOut();
    }

    graphQLErrors.forEach(async (error: GraphQLError) => {
      console.error(`GQL_ERROR: ${error.message}`);
    });
  }

  if (networkError) {
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
  link: ApolloLink.from([errorLink, authLink, terminatingLink]),
});

export default client;
