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
  getApiAccessTokens,
  updateApiAccessTokens,
} from "./auth/util";
import {
  apiBaseUrl,
  authEnabled,
  isBrowser,
  PROFILE_TOKEN_HEADER,
} from "./const";

// list of operations that need authentication
const needsAuthentication = ["listReservations", "reservationByPk"];

const getNewToken = (): Promise<[string, string]> =>
  updateApiAccessTokens(getAccessToken());

const authLink = new ApolloLink((operation, forward) => {
  const [apiAccessToken, profileApiAccessToken] = getApiAccessTokens();

  if (!apiAccessToken) {
    return fromPromise(
      getNewToken().catch(() => {
        // TODO Handle token refresh error
        if (authEnabled) {
          if (needsAuthentication.includes(operation.operationName)) {
            return false;
          }
        }

        return forward(operation);
      })
    )
      .filter((value) => Boolean(value))
      .flatMap((accessTokens) => {
        if (Array.isArray(accessTokens)) {
          const oldHeaders = operation.getContext().headers;
          const [newApiAccessToken, newProfileApiAccessToken] =
            accessTokens || ["", ""];
          operation.setContext({
            headers: {
              ...oldHeaders,
              authorization: `Bearer ${newApiAccessToken}`,
              [PROFILE_TOKEN_HEADER]: newProfileApiAccessToken,
            },
          });
        }
        return forward(operation);
      });
  }
  operation.setContext(({ headers }) => ({
    headers: {
      ...headers,
      authorization: apiAccessToken ? `Bearer ${apiAccessToken}` : "",
      [PROFILE_TOKEN_HEADER]: profileApiAccessToken || "",
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

    const hasAuthError = Boolean(authError !== undefined); // token has expired?

    if (hasAuthError) {
      return fromPromise(
        getNewToken().catch(() => {
          // TODO Handle token refresh error
          return false;
        })
      )
        .filter((value) => Boolean(value))
        .flatMap((accessTokens) => {
          if (Array.isArray(accessTokens)) {
            const [newApiAccessToken, newProfileApiAccessToken] =
              accessTokens || ["", ""];

            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${newApiAccessToken}`,
                [PROFILE_TOKEN_HEADER]: newProfileApiAccessToken,
              },
            });
          }
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
  link: isBrowser ? from([errorLink, authLink, httpLink]) : from([httpLink]),
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
