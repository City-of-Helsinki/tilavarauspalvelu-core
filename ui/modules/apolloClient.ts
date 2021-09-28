import { ApolloClient, InMemoryCache } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { apiBaseUrl } from "./const";

const client = new ApolloClient({
  uri: `${apiBaseUrl}/graphql/`,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          reservationUnits: relayStylePagination(),
        },
      },
    },
  }),
  ssrMode: true,
  defaultOptions: {
    watchQuery: {
      errorPolicy: "ignore",
    },
    query: {
      errorPolicy: "ignore",
    },
  },
});

export default client;
