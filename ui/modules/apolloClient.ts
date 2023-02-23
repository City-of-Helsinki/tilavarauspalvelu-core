import { setContext } from "@apollo/client/link/context";
import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { getSession, signOut } from "next-auth/react";
import { GraphQLError } from "graphql";

import {
  apiBaseUrl,
  isBrowser,
  PROFILE_TOKEN_HEADER,
  SESSION_EXPIRED_ERROR,
} from "./const";
import { ExtendedSession } from "../pages/api/auth/[...nextauth]";

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

const handleSignOut = async () => {
  await signOut();
};

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    const isSessionExpired = graphQLErrors.some((error) =>
      error.message.includes(SESSION_EXPIRED_ERROR)
    );

    if (isSessionExpired) {
      handleSignOut();
    }

    graphQLErrors.forEach(async (error: GraphQLError) => {
      console.error(`GQL_ERROR: ${error.message}`);
    });
  }

  if (networkError) {
    console.error(`NETWORK_ERROR: ${networkError.message}`);
  }
});

const httpLink = new HttpLink({ uri: `${apiBaseUrl}/graphql/` });

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          reservationUnits: relayStylePagination(),
        },
      },
    },
  }),
  link: isBrowser ? from([errorLink, authLink, httpLink]) : from([httpLink]),
  ssrMode: !isBrowser,
  defaultOptions: {
    watchQuery: {
      errorPolicy: "ignore",
    },
    query: {
      errorPolicy: "ignore",
      fetchPolicy: isBrowser ? "cache-first" : "no-cache",
    },
  },
});

export default client;
