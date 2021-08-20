import { ApolloClient, InMemoryCache } from "@apollo/client";
import { apiBaseUrl } from "./const";

const client = new ApolloClient({
  uri: `${apiBaseUrl}/graphql/`,
  cache: new InMemoryCache(),
});

export default client;
