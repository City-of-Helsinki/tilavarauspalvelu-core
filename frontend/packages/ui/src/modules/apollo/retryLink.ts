import { RetryLink } from "@apollo/client/link/retry";
import { getMainDefinition } from "@apollo/client/utilities";
import { Kind, OperationTypeNode } from "graphql";
import type { ApolloLink } from "@apollo/client";
import { classifyError } from "./errors";
import type { FetchError } from "./errors";

/// The first request and the retries.
/// On the server all attempts must fit well below the gateway timeout (SERVER_FETCH_TIMEOUT_MS for each attempt).
const SERVER_MAX_ATTEMPTS = 2;
const CLIENT_MAX_ATTEMPTS = 3;

/// The wait before a retry doubles after each attempt, with a random part so the clients don't retry at the same time
const RETRY_DELAY = { initial: 300, max: 2000, jitter: true };

const RETRY_HTTP_STATUSES = new Set([502, 503, 504]);

/// True if the same request can succeed when we send it again.
/// For example the backend restarts in a deploy, or the gateway has no backend to send the request to.
export function isTransientError(error: FetchError, isServer: boolean): boolean {
  switch (error.kind) {
    case "connection":
      return true;
    case "http":
      return RETRY_HTTP_STATUSES.has(error.status);
    case "timeout":
      // In the browser the user has already waited for the full CLIENT_FETCH_TIMEOUT_MS
      return isServer;
    // The backend answered, the same request gets the same answer
    case "graphql":
    case "invalid_query":
    case "csrf":
    case "unknown":
      return false;
  }
}

function isQuery(operation: ApolloLink.Operation): boolean {
  const definition = getMainDefinition(operation.query);
  return definition.kind === Kind.OPERATION_DEFINITION && definition.operation === OperationTypeNode.QUERY;
}

/// Send a failed query again if the error is transient.
/// Never retry a mutation. It can have completed on the backend, for example a reservation or a payment.
/// Put this link after the error link, so the error link sees only the last error.
export function createRetryLink(isServer: boolean): RetryLink {
  return new RetryLink({
    delay: RETRY_DELAY,
    attempts: {
      max: isServer ? SERVER_MAX_ATTEMPTS : CLIENT_MAX_ATTEMPTS,
      retryIf: (error, operation) => isQuery(operation) && isTransientError(classifyError(error), isServer),
    },
  });
}
