import { ApolloClient, InMemoryCache } from "@apollo/client";
import { apiBaseUrl } from "./const";

const client = new ApolloClient({
  uri: `${apiBaseUrl}/graphql/`,
  cache: new InMemoryCache(),
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
