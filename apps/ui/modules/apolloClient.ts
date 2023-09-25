import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { GraphQLError } from "graphql";
import { apiBaseUrl, isBrowser } from "./const";

// TODO the validation needs to go to env.mjs because this reloads the page constantly
// TODO we should default to this host if the env variable is not set
// allowing us to host the api and the frontend on the same host without rebuilding the Docker container
// possible problem: SSR requires absolute url for the api (so get the host url?)
if (process.env.SKIP_ENV_VALIDATION !== "true") {
  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL is not defined");
  }
  // this could be a transformation on the base value in env.mjs and a warning
  // throwing here because we'd have to fix all baseurls
  if ((apiBaseUrl.match("localhost") || apiBaseUrl.match("127.0.0.1")) && apiBaseUrl.startsWith("https://")) {
    throw new Error("API_BASE_URL is not valid, don't use SSL (https) when using localhost");
  }
}

const apiUrl = apiBaseUrl ?? "";

// a hack to workaround node-fetch dns problems with localhost
// this will not work with authentication so when we add authentication to the SSR we need to fix it properly
const shouldModifyLocalhost = (process.env.ENABLE_FETCH_HACK === "true") && !isBrowser && apiUrl.includes("localhost");
const graphqlHostUrl = shouldModifyLocalhost ? apiUrl.replace("localhost", "127.0.0.1") : apiUrl;
const uri = `${graphqlHostUrl}${graphqlHostUrl.endsWith('/') ? '' : '/'}graphql/`;

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

const httpLink = new HttpLink({ uri: uri, credentials: "include" });

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
