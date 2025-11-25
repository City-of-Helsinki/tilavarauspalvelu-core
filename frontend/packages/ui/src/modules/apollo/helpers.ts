import type { IncomingMessage, IncomingHttpHeaders } from "node:http";
import qs from "node:querystring";
import type { ServerError, ServerParseError, Operation } from "@apollo/client";
import { ApolloError } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { getOperationName } from "@apollo/client/utilities";
import * as Sentry from "@sentry/nextjs";
import type { GraphQLFormattedError, DocumentNode } from "graphql";
import { print } from "graphql";
import { Roarr as log } from "roarr";
import { getCookie } from "typescript-cookie";
import { RESERVEE_PI_FIELDS } from "@ui/components/reservation-form/utils";
import { toast } from "../../components/toast";
import { getLocalizationLang, isBrowser } from "../helpers";
import type { LocalizationLanguages } from "../urlBuilder";

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

export type QueryErrorT =
  | {
      type: "GRAPHQL_ERROR";
      message: string;
      details: ApiError[];
      errors?: GraphQLFormattedError[];
    }
  | {
      type: "NETWORK_ERROR";
      code: string;
      message: string;
      details?: string;
    }
  | {
      type: "ECONNREFUSED"; // separate connection refused since it has different handling
      message: string;
    }
  | {
      type: "CSRF_ERROR";
      message: string;
    }
  | {
      type: "NON_API_ERROR";
      message: string;
      details?: string;
    };

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
  "FILTER_PERMISSION_DENIED",
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

function isPermissionError(code: string | null): boolean {
  return code != null && new Set(PERMISSION_ERROR_CODES).has(code);
}

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
      if (isPermissionError(code)) {
        // TODO improve mapping (it works for code, but other fields including message is null)
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

/// Capture all graphql errors as warnings in Sentry
/// if some errors are properly handled in the UI add filter here
/// During development log to console
export const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // graphQLError can also raise 400 network error
  // don't toast that, but allow 400 errors in case they are not graphql errors
  if (graphQLErrors == null && networkError != null && isBrowser) {
    toastNetworkError(networkError);
  }
  const errors = transformApolloError(new ApolloError({ graphQLErrors, networkError }));
  logGraphQLError(errors, operation);
});

// helper to ignore 403 CSRF errors
// admin ui has no middleware that could redirect to backend when it's missing
// in practice this is not a problem because login sets the CSRF token and login page is static
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

const NETWORK_ERROR_TRANSLATIONS: Record<LocalizationLanguages, string> = {
  en: "Unable to connect to the service. Please try again.",
  fi: "Palveluun ei saada yhteyttä, yritä uudelleen.",
  sv: "Det går inte att ansluta till tjänsten. Försök igen.",
};

function toastNetworkError(error: Error | ServerParseError | ServerError): void {
  if (!isBrowser) {
    return;
  }
  // don't toast CSRF errors
  if (isCSRFError(error)) {
    return;
  }
  const lang = getLocalizationLang(document.documentElement.lang);
  let errorMsg = NETWORK_ERROR_TRANSLATIONS[lang];

  const errorToastId = "network_error";

  // don't create multiple toasts
  if (!document.querySelector(`#${errorToastId}`)) {
    // Not translated because of how difficult it is to pass the translation function here
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

function getServerCookie(headers: IncomingHttpHeaders | undefined, name: string) {
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

function extractErrorCode(error: ApiError): string | string[] {
  if ("validation_code" in error && error.validation_code != null && typeof error.validation_code === "string") {
    return [error.code, error.validation_code];
  }
  if (error.code != null) {
    return error.code;
  }
  return [];
}
export function logGraphQLError(error: QueryErrorT, operation?: Operation): void {
  // - one function to transform the error (handles the different cases with network errors)
  // - then a single log function (for now it can both send to sentry and local logger)
  //   - create a fingerprint that is bit more specific than currently, but most of the info (query etc. should go to
  //   context)

  type SentryCtx = {
    level: "warning";
    fingerprint?: string[];
    extra?: Record<string, string>;
  };
  const context: SentryCtx = {
    level: "warning" as const,
  };
  let errorName = "Unknown";

  switch (error.type) {
    case "GRAPHQL_ERROR":
      {
        const permissionError = error.details.find((x) => isPermissionError(x.code));
        if (permissionError) {
          log.error(`graphql permission error: ${JSON.stringify(permissionError)}`);
        } else {
          log.error(`graphql errors: ${JSON.stringify(error)}`);
        }
        // NOTE in case we have multiple errors in the response this will create separate buckets for those
        const apiErrorCodes = error.details.flatMap((e) => extractErrorCode(e));
        const codes = new Set(apiErrorCodes).keys().toArray();
        context.extra = {
          details: JSON.stringify(error),
        };
        context.fingerprint = ["graphql_error", ...(operation != null ? [operation?.operationName] : []), ...codes];
        errorName = `GraphQL error: ${operation?.operationName ?? ""} ${codes.join(",")}`;
      }
      break;
    case "NETWORK_ERROR":
      log.error(`network error: ${JSON.stringify(error)}`);
      errorName = "NETWORK_ERROR";
      context.extra = {
        details: JSON.stringify(error),
      };
      context.fingerprint = ["network_error", error.code];
      break;
    case "ECONNREFUSED":
      log.error(`connection refused`);
      errorName = "ECONNREFUSED";
      context.extra = {
        details: JSON.stringify(error),
      };
      context.fingerprint = ["connection_refused"];
      break;
    case "NON_API_ERROR":
      log.error(`other errors: ${JSON.stringify(error)}`);
      errorName = "NON_API_ERROR";
      context.extra = {
        details: JSON.stringify(error),
      };
      context.fingerprint = ["non_api_error", error.message];
      break;
    case "CSRF_ERROR":
      log.error(`csrf error: ${error.message}`);
      errorName = "CSRF_ERROR";
      context.fingerprint = ["csrf_error"];
  }
  context.extra = {
    ...context.extra,
    ...(operation != null
      ? {
          operationName: operation.operationName,
          query: print(operation.query),
          variables: JSON.stringify(removePi(operation.variables)),
        }
      : {}),
  };
  Sentry.captureMessage(errorName, context);
}

function removePi(dict: Record<string, unknown>): Record<string, unknown> {
  for (const field of RESERVEE_PI_FIELDS) {
    if (dict[field] != null) {
      dict[field] = "*****";
    }
    const input = dict["input"];
    if (typeof input === "object" && input != null && field in input) {
      const iDict = input as Record<string, unknown>;
      iDict[field] = "*****";
    }
  }
  return dict;
}

export function logGraphQLQuery(
  timeMs: number,
  url: string | undefined,
  documents: DocumentNode | DocumentNode[]
): void {
  const operationName = Array.isArray(documents)
    ? documents.map(getOperationName).map((x) => x ?? "")
    : (getOperationName(documents) ?? "");
  const t = Math.round(timeMs);
  // TODO should log if it's a mutation / query (though we probably aren't logging mutations)
  log.info(
    {
      timeMs: t,
      url,
      operationName,
    },
    `GQL query ${operationName} took: ${t} ms`
  );
}

// This only returns one error from the ApolloError, technically it could include both network and graphql errors
// but in what case that would happen? a fetch fail + parse error maybe.
function transformApolloError(error: ApolloError): QueryErrorT {
  const { graphQLErrors } = error;
  const ERROR_400_STRING = "Response not successful: Received status code 400";
  const isUserError = error.message.includes(ERROR_400_STRING);
  if (isUserError) {
    return {
      type: "GRAPHQL_ERROR",
      message: error.message,
      details: [{ code: "INVALID_GRAPHQL_QUERY" }],
      errors: [...graphQLErrors],
    };
  }
  const gqlErrors = getApiErrors(error);
  if (gqlErrors.length > 0) {
    const codes = new Set(gqlErrors.map((e) => e.code)).keys().toArray();
    const hasCode = codes.some((x) => x !== "UNKNOWN");
    const message = hasCode ? `Graphql VALIDATION errors: ${codes}` : error.message;
    return {
      type: "GRAPHQL_ERROR",
      message,
      details: hasCode ? gqlErrors : [],
      errors: [...graphQLErrors],
    };
  }

  // NOTE have to process GraphQL errors first becasue they might raise 400 user error
  if (error.networkError != null) {
    if (isCSRFError(error.networkError)) {
      return {
        type: "CSRF_ERROR",
        message: "CSRF verfiication failed.",
      };
    }
    const { networkError } = error;
    const { cause } = error.networkError;
    if (
      typeof cause === "object" &&
      cause != null &&
      "code" in cause &&
      cause.code != null &&
      typeof cause.code === "string"
    ) {
      // The backend is down (nodejs version)
      if (cause.code === "ECONNREFUSED") {
        return {
          type: "ECONNREFUSED",
          message: "Connection refused (backend down).",
        };
      }
      return {
        type: "NETWORK_ERROR",
        code: cause.code,
        message: `${cause.code} fetch error`,
      };
    } else if (cause == null) {
      if (networkError instanceof TypeError) {
        const terror = networkError;
        // Browser errors have zero info why it failed outside of message
        const BROWSER_ECONREFUSED_MSG = "Failed to fetch";
        if (terror.message.startsWith(BROWSER_ECONREFUSED_MSG)) {
          return {
            type: "ECONNREFUSED",
            message: "Connection refused (backend down).",
          };
        }
        return {
          type: "NETWORK_ERROR",
          code: "UNKNOWN",
          message: `${terror.name} fetch error with message ${terror.message}`,
        };
      }
      if ("statusCode" in networkError) {
        return {
          type: "NETWORK_ERROR",
          code: String(networkError.statusCode),
          message: `${networkError.statusCode} fetch error ""`,
          details: JSON.stringify(networkError),
        };
      }
      return {
        type: "NETWORK_ERROR",
        code: "UNKNOWN",
        message: `Unknown fetch error without a cause`,
        details: JSON.stringify(networkError),
      };
    }
    return {
      type: "NETWORK_ERROR",
      code: "UNKNOWN",
      message: `Unknown fetch error with cause "${cause.toString()}"`,
      details: JSON.stringify(networkError),
    };
  }

  return {
    type: "GRAPHQL_ERROR",
    message: "GraphQL error",
    details: [],
    errors: [...graphQLErrors],
  };
}

export function transformQueryError(error: unknown): QueryErrorT {
  if (error instanceof ApolloError) {
    return transformApolloError(error);
  }
  if (typeof error === "object" && error != null && "message" in error && typeof error.message === "string") {
    return {
      type: "NON_API_ERROR",
      message: error.message,
      details: JSON.stringify(error),
    };
  }
  return {
    type: "NON_API_ERROR",
    message: `Unknown fetch error with details "${JSON.stringify(error)}"`,
  };
}
