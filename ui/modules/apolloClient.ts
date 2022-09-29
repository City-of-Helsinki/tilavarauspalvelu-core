import {
  ApolloClient,
  ApolloLink,
  fromPromise,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import {
  getAccessToken,
  getApiAccessToken,
  updateApiAccessToken,
} from "./auth/util";
import { apiBaseUrl } from "./const";

// list of operations that need authentication
const needsAuthentication = ["listReservations", "reservationByPk", "units"];

const getNewToken = (): Promise<string> =>
  updateApiAccessToken(getAccessToken());

const authLink = new ApolloLink((operation, forward) => {
  const token = getApiAccessToken();

  if (!token) {
    return fromPromise(
      getNewToken().catch(() => {
        // TODO Handle token refresh error
        if (needsAuthentication.includes(operation.operationName)) {
          return false;
        }

        return forward(operation);
      })
    )
      .filter((value) => Boolean(value))
      .flatMap((accessToken) => {
        const oldHeaders = operation.getContext().headers;
        operation.setContext({
          headers: {
            ...oldHeaders,
            authorization: `Bearer ${accessToken}`,
          },
        });

        return forward(operation);
      });
  }

  operation.setContext(({ headers }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }));

  return forward(operation);
});

// eslint-disable-next-line consistent-return
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    const authError = graphQLErrors.find((e) => {
      return (
        e.message !== null &&
        (e.message.indexOf("AnonymousUser") !== -1 ||
          e.message.indexOf("has expired") !== -1 ||
          e.message.indexOf("too old") !== -1 ||
          e.message.indexOf("No permission to mutate") !== -1)
      );
    });

    const hasAuthError = Boolean(authError !== undefined);

    if (hasAuthError) {
      return fromPromise(
        getNewToken().catch(() => {
          // TODO Handle token refresh error
          return null;
        })
      )
        .filter((value) => Boolean(value))
        .flatMap((accessToken) => {
          const oldHeaders = operation.getContext().headers;
          operation.setContext({
            headers: {
              ...oldHeaders,
              authorization: `Bearer ${accessToken}`,
            },
          });

          return forward(operation);
        });
    }
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
  link: from([errorLink, authLink, httpLink]),
  ssrMode: typeof window === undefined,
  defaultOptions: {
    watchQuery: {
      errorPolicy: "ignore",
    },
    query: {
      errorPolicy: "ignore",
      fetchPolicy: typeof window === undefined ? "no-cache" : "cache-first",
    },
  },
});

export default client;
