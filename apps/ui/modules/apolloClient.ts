import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { GraphQLError } from "graphql";
import { apiBaseUrl, isBrowser } from "./const";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(async (error: GraphQLError) => {
      console.error(`GQL_ERROR: ${error.message}`);
    });
  }

  if (networkError) {
    console.error(`NETWORK_ERROR: ${networkError.message}`);
  }
});

const httpLink = new HttpLink({ uri: `${apiBaseUrl}/graphql/`, credentials: "include" });

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
  link: isBrowser ? from([errorLink, httpLink]) : from([httpLink]),
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
