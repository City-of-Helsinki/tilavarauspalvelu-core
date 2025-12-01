import type { IncomingMessage, IncomingHttpHeaders } from "node:http";
import qs from "node:querystring";
import type { ServerError, ServerParseError } from "@apollo/client";
import { ApolloError } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import * as Sentry from "@sentry/nextjs";
import type { GraphQLFormattedError } from "graphql";
import { getCookie } from "typescript-cookie";
import { toast } from "../components/toast";
import { isBrowser } from "./helpers";

// TODO narrow down the error codes and transform unknowns to catch all
type ErrorCode = string;

export interface ApiError {
  code: ErrorCode;
}

export interface ValidationError extends ApiError {
  message: string | null;
  field: string | null;
  validation_code: string | null;
}

export interface OverlappingError extends ApiError {
  overlapping: Array<{ begin: string; end: string }>;
}

/**
 * Maps GraphQL validation errors from the API response to structured ValidationError objects
 * @param gqlError - GraphQL formatted error from the API response
 * @returns Array of structured validation errors with code, message, field, and validation_code
 */
function mapValidationError(gqlError: GraphQLFormattedError): ValidationError[] {
  const { extensions } = gqlError;
  const code = getExtensionCode(gqlError);
  if (extensions != null && "errors" in extensions && Array.isArray(extensions.errors)) {
    // field errors
    const { errors } = extensions;
    const errs = errors.map((err: unknown) => {
      if (typeof err !== "object" || err == null) {
        return null;
      }
      if (code != null && "message" in err && "field" in err) {
        const { message, field } = err ?? {};
        const validation_code = "code" in err && err.code !== "" ? err.code : null;
        return {
          code,
          message: typeof message !== "string" ? null : message,
          field: typeof field !== "string" ? null : field,
          validation_code,
        };
      }
      return null;
    });
    return errs.filter((e): e is ValidationError => e != null);
  } else if (code != null) {
    return [
      {
        code,
        message: null,
        field: null,
        validation_code: null,
      },
    ];
  }
  return [];
}

const PERMISSION_ERROR_CODES = [
  "UPDATE_PERMISSION_DENIED",
  "CREATE_PERMISSION_DENIED",
  "DELETE_PERMISSION_DENIED",
  "MUTATION_PERMISSION_DENIED",
  "NODE_PERMISSION_DENIED",
];
// TODO refactor users to use getApiErrors
export function getPermissionErrors(error: unknown): ValidationError[] {
  if (error == null) {
    return [];
  }

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const hasExtension = (e: (typeof graphQLErrors)[0]) => {
        const code = getExtensionCode(e);
        return PERMISSION_ERROR_CODES.some((x) => x === code);
      };
      return graphQLErrors.filter(hasExtension).flatMap(mapValidationError);
    }
  }
  return [];
}

// TODO refactor users to use getApiErrors
export function getValidationErrors(error: unknown): ValidationError[] {
  if (error == null) {
    return [];
  }

  // TODO separate validation errors: this is invalid form values (user error)
  const MUTATION_ERROR_CODE = "MUTATION_VALIDATION_ERROR";

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const isMutationError = (e: (typeof graphQLErrors)[0]) => {
        const code = getExtensionCode(e);
        return code === MUTATION_ERROR_CODE;
      };
      return graphQLErrors.filter(isMutationError).flatMap(mapValidationError);
    }
  }
  return [];
}

// TODO write a zod schema for this instead
/* here it's
{
extensions: {
  code : "RESERVATION_SERIES_OVERLAPS"
  overlapping : [{…}]
}
*/
/**
 * Maps GraphQL reservation overlap errors from the API response
 * Extracts overlapping time ranges from the error extensions
 * @param gqlError - GraphQL formatted error from the API response
 * @returns Object containing overlap details and error code, or empty array if no overlaps found
 */
function mapOverlapError(gqlError: GraphQLFormattedError) {
  const { extensions } = gqlError;

  const code = getExtensionCode(gqlError);
  if (extensions != null && "overlapping" in extensions) {
    const { overlapping } = extensions ?? {};
    if (code == null || !Array.isArray(overlapping) || overlapping.length === 0) {
      return [];
    }
    const ov = overlapping.map((o: unknown) => {
      if (typeof o !== "object" || o == null) {
        return null;
      }
      if ("begin" in o && "end" in o) {
        const { begin, end } = o;
        if (typeof begin !== "string" || typeof end !== "string") {
          return null;
        }
        return { begin, end };
      }
      return null;
    });
    const fov = ov.filter((e): e is { begin: string; end: string } => e != null);
    return { overlapping: fov, code };
  }
  return [];
}

// TODO refactor this to use any code to filter erros
// TODO this should return flat array of overlaps not nested
export function getSeriesOverlapErrors(error: unknown): OverlappingError[] {
  if (error == null) {
    return [];
  }
  const CODE = "RESERVATION_SERIES_OVERLAPS";

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const isSpecificError = (e: (typeof graphQLErrors)[0]) => {
        const code = getExtensionCode(e);
        return code === CODE;
      };
      return graphQLErrors.filter(isSpecificError).flatMap(mapOverlapError);
    }
  }
  return [];
}

/**
 * Maps an array of GraphQL errors to structured API error objects
 * Handles different error types (validation, overlap, generic) and extracts relevant data
 * @param graphQLErrors - Array of GraphQL formatted errors from the API response
 * @returns Array of structured API error objects
 */
function mapGraphQLErrors(graphQLErrors: ReadonlyArray<Readonly<GraphQLFormattedError>>): ApiError[] {
  if (graphQLErrors.length > 0) {
    return graphQLErrors.flatMap((err) => {
      const code = getExtensionCode(err);
      if (code === "RESERVATION_SERIES_OVERLAPS") {
        return mapOverlapError(err);
      }
      if (code === "MUTATION_VALIDATION_ERROR") {
        return mapValidationError(err);
      }
      return {
        code: code ?? "UNKNOWN",
      };
    });
  }
  return [];
}

// TODO add non-graphql errors code
// TODO add no-extension errors
export function getApiErrors(error: unknown): ApiError[] {
  if (error == null) {
    return [];
  }

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    return mapGraphQLErrors(graphQLErrors);
  }
  return [];
}

export function isNotFoundError(e: unknown): boolean {
  const errors = getApiErrors(e);
  if (errors.length > 0) {
    const notFoundErrors = errors.filter((e) => e.code === "NOT_FOUND");
    return notFoundErrors.length > 0;
  }
  return false;
}

/**
 * Extracts the error code from a GraphQL error's extensions
 * Supports both new (error_code) and old (code) extension formats
 * @param e - GraphQL formatted error
 * @returns Error code string or null if not found
 */
function getExtensionCode(e: GraphQLFormattedError): string | null {
  if (e.extensions == null) {
    return null;
  }
  if (e.extensions.error_code != null && typeof e.extensions.error_code === "string") {
    return e.extensions.error_code;
  }
  // old extension name
  if (e.extensions.code != null && typeof e.extensions.code === "string") {
    return e.extensions.code;
  }
  return null;
}

/**
 * Extracts error code(s) from an API error object
 * For validation errors, returns both the main code and validation_code
 * @param error - API error object
 * @returns Single error code string, array of codes [main, validation], or empty array
 */
function extractErrorCode(error: ApiError): string | string[] {
  if ("validation_code" in error && error.validation_code != null && typeof error.validation_code === "string") {
    return [error.code, error.validation_code];
  }
  if (error.code != null) {
    return error.code;
  }
  return [];
}

/// Capture all graphql errors as warnings in Sentry
/// if some errors are properly handled in the UI add filter here
/// During development log to console
export const errorLink = onError(({ graphQLErrors, networkError }) => {
  // NOTE in case we have multiple errors in the response this will create separate buckets for those
  const apiErrors = mapGraphQLErrors(graphQLErrors ?? []);
  const apiErrorCodes = apiErrors.flatMap((e) => extractErrorCode(e));
  const context = {
    level: "warning" as const,
    // have to encode the errors [Object Object] otherwise
    extra: {
      ...(graphQLErrors != null ? { graphQLErrors: JSON.stringify(graphQLErrors) } : {}),
      ...(networkError != null ? { networkError: JSON.stringify(networkError) } : {}),
    },
    fingerprint: ["graphql_error", ...apiErrorCodes],
  };
  Sentry.captureMessage(`GraphQL error: ${apiErrorCodes.join(",")}`, context);

  // graphQLError can also raise 400 network error
  // don't toast that, but allow 400 errors in case they are not graphql errors
  if (graphQLErrors == null && networkError != null && isBrowser) {
    toastNetworkError(networkError);
  }

  // During development (especially for SSR) log to console since there is no network tab
  // better method would be to use a logger / push errors to client side
  if (process.env.NODE_ENV === "development") {
    if (graphQLErrors) {
      for (const error of graphQLErrors) {
        // eslint-disable-next-line no-console
        console.error(`GQL_ERROR: ${JSON.stringify(error, null, 2)}`);
      }
    } else if (networkError) {
      if (isCSRFError(networkError)) {
        // don't log CSRF errors to console
        return;
      }
      // eslint-disable-next-line no-console
      console.error(`NETWORK_ERROR: ${JSON.stringify(networkError, null, 2)}`);
    }
  }
});

/**
 * Checks if a network error is a CSRF failure (403 with CSRF_FAILURE code)
 * Helper to ignore CSRF errors that occur when middleware is missing
 * In practice not a problem because login sets the CSRF token and login page is static
 * @param error - Network error from Apollo Client
 * @returns True if error is a CSRF failure, false otherwise
 */
function isCSRFError(error: Error | ServerParseError | ServerError): boolean {
  const statusCode = "statusCode" in error ? error.statusCode : null;

  if (
    statusCode === 403 &&
    "result" in error &&
    error.result != null &&
    typeof error.result === "object" &&
    "code" in error.result
  ) {
    const code = error.result.code;
    if (code === "CSRF_FAILURE") {
      return true;
    }
  }
  return false;
}

/**
 * Displays a toast notification for network errors
 * Skips CSRF errors to avoid unnecessary notifications
 * @param error - Network error from Apollo Client
 */
function toastNetworkError(error: Error | ServerParseError | ServerError) {
  // don't toast CSRF errors
  if (isCSRFError(error)) {
    return;
  }

  const errorToastId = "network_error";

  // don't create multiple toasts
  if (!document.querySelector(`#${errorToastId}`)) {
    // Not translated because of how difficult it is to pass the translation function here
    let errorMsg = "Network error";
    if ("statusCode" in error) {
      errorMsg += `: ${error.statusCode}`;
    }
    toast({
      text: errorMsg,
      type: "error",
      options: { toastId: errorToastId },
    });
  }
}

export function getServerCookie(headers: IncomingHttpHeaders | undefined, name: string) {
  const cookie = headers?.cookie;
  if (cookie == null) {
    return null;
  }
  const decoded = qs.decode(cookie, "; ");
  const token = decoded[name];
  if (token == null) {
    return null;
  }
  if (Array.isArray(token)) {
    // eslint-disable-next-line no-console
    console.warn(`multiple ${name} in cookies`, token);
    return token[0];
  }
  return token;
}

export function enchancedFetch(req?: IncomingMessage) {
  return (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const isServer = typeof window === "undefined";
    const csrfToken = isServer ? getServerCookie(req?.headers, "csrftoken") : getCookie("csrftoken");
    const headers = new Headers({
      ...(init?.headers != null ? init.headers : {}),
      // TODO missing csrf token is a non recoverable error
      ...(csrfToken != null ? { "X-Csrftoken": csrfToken } : {}),
    });

    // NOTE server requests don't include cookies by default
    // TODO do we want to copy request headers from client or no?
    if (isServer) {
      if (req == null) {
        throw new Error("request is required for server-side fetch");
      }
      if (req?.headers == null) {
        throw new Error("request headers must be defined for server-side fetch");
      }
      if (csrfToken == null) {
        throw new Error("csrftoken not found in cookies");
      }
      headers.append("Set-Cookie", `csrftoken=${csrfToken}`);
      headers.append("Cookie", `csrftoken=${csrfToken}`);
      // Django fails with 403 if there is no referer (only on Kubernetes)
      const requestUrl = req.url ?? "";
      const hostname = req.headers["x-forwarded-host"] ?? req.headers.host ?? "";
      // NOTE not exactly correct
      // For our case this is sufficent because we are always behind a proxy,
      // but technically there is a case where we are not behind a gateway and not localhost
      // so the proto would be https and no x-forwarded-proto set
      // TODO we have .json blobs in the referer (translations), does it matter?
      const proto = req.headers["x-forwarded-proto"] ?? "http";
      headers.append("Referer", `${proto}://${hostname}${requestUrl}`);

      const sessionCookie = getServerCookie(req?.headers, "sessionid");
      if (sessionCookie != null) {
        headers.append("Cookie", `sessionid=${sessionCookie}`);
        headers.append("Set-Cookie", `sessionid=${sessionCookie}`);
      }
    }

    return fetch(url, {
      ...init,
      headers,
    });
  };
}
