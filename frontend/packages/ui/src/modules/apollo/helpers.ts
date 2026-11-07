import type { IncomingMessage, IncomingHttpHeaders } from "node:http";
import { CombinedGraphQLErrors, ServerError, ServerParseError } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import { getMainDefinition } from "@apollo/client/utilities";
import * as Sentry from "@sentry/nextjs";
import { getOperationAST, Kind, OperationTypeNode, print } from "graphql";
import { Roarr as log } from "roarr";
import { getCookie } from "typescript-cookie";
import type { ApolloLink, ErrorLike } from "@apollo/client";
import type { GraphQLFormattedError, DocumentNode } from "graphql";
import { RESERVEE_PI_FIELDS } from "@ui/components/reservation-form/utils";
import { toast } from "../../components/toast";
import { CLIENT_FETCH_TIMEOUT_MS, CLIENT_UPLOAD_TIMEOUT_MS, SERVER_FETCH_TIMEOUT_MS } from "../const";
import { CsrfTokenNotFound } from "../errors";
import { fetchWithTimeout, isTimeoutError } from "../fetch";
import { getLocalizationLang, isBrowser } from "../helpers";
import { getClientOrigin } from "../urlBuilder";
import type { LocalizationLanguages } from "../urlBuilder";

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
      type: "TIMEOUT";
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

export function getPermissionErrors(error: unknown): ValidationError[] {
  if (error == null) {
    return [];
  }

  if (CombinedGraphQLErrors.is(error)) {
    const graphQLErrors = error.errors;
    if (graphQLErrors.length > 0) {
      const hasExtension = (e: (typeof graphQLErrors)[0]) => {
        const code = getExtensionCode(e);
        return PERMISSION_ERROR_CODES.some((x) => x === code);
      };
      return graphQLErrors.filter((err) => hasExtension(err)).flatMap((err) => mapValidationError(err));
    }
  }
  return [];
}

export function getValidationErrors(error: unknown): ValidationError[] {
  if (error == null) {
    return [];
  }

  const MUTATION_ERROR_CODE = "MUTATION_VALIDATION_ERROR";

  if (CombinedGraphQLErrors.is(error)) {
    const graphQLErrors = error.errors;
    if (graphQLErrors.length > 0) {
      const isMutationError = (e: (typeof graphQLErrors)[0]) => {
        const code = getExtensionCode(e);
        return code === MUTATION_ERROR_CODE;
      };
      return graphQLErrors.filter((err) => isMutationError(err)).flatMap((err) => mapValidationError(err));
    }
  }
  return [];
}

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

export function getSeriesOverlapErrors(error: unknown): OverlappingError[] {
  if (error == null) {
    return [];
  }
  const CODE = "RESERVATION_SERIES_OVERLAPS";

  if (CombinedGraphQLErrors.is(error)) {
    const graphQLErrors = error.errors;
    if (graphQLErrors.length > 0) {
      const isSpecificError = (e: (typeof graphQLErrors)[0]) => {
        const code = getExtensionCode(e);
        return code === CODE;
      };
      return graphQLErrors.filter((err) => isSpecificError(err)).flatMap((err) => mapOverlapError(err));
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
        return mapValidationError(err);
      }
      return {
        code: code ?? "UNKNOWN",
      };
    });
  }
  return [];
}

export function getApiErrors(error: unknown): ApiError[] {
  if (error == null) {
    return [];
  }

  if (CombinedGraphQLErrors.is(error)) {
    const graphQLErrors = error.errors;
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
export const errorLink = new ErrorLink(({ error, operation }) => {
  // the backend returns an invalid query as a 400 response, don't toast that
  if (!CombinedGraphQLErrors.is(error) && !isInvalidQueryError(error) && isBrowser) {
    toastNetworkError(error, operation);
  }
  logGraphQLError(transformQueryError(error), operation);
});

// The backend returns 400 if the query is not valid (graphene-django returns resolver errors with 200)
function isInvalidQueryError(error: unknown): error is ServerError {
  return ServerError.is(error) && error.statusCode === 400;
}

// helper to ignore 403 CSRF errors
// admin ui has no middleware that could redirect to backend when it's missing
// in practice this is not a problem because login sets the CSRF token and login page is static
function isCSRFError(error: unknown): boolean {
  if (!ServerError.is(error) || error.statusCode !== 403) {
    return false;
  }
  try {
    const body: unknown = JSON.parse(error.bodyText);
    return typeof body === "object" && body != null && "code" in body && body.code === "CSRF_FAILURE";
  } catch {
    return false;
  }
}

const NETWORK_ERROR_TRANSLATIONS: Record<LocalizationLanguages, string> = {
  en: "Unable to connect to the service. Please try again.",
  fi: "Palveluun ei saada yhteyttä, yritä uudelleen.",
  sv: "Det går inte att ansluta till tjänsten. Försök igen.",
};

// A mutation that timed out can still complete on the backend, so don't tell the user to try again
const MUTATION_TIMEOUT_TRANSLATIONS: Record<LocalizationLanguages, string> = {
  en: "The service did not respond in time. Your change can still be saved. Refresh the page before you try again.",
  fi: "Palvelu ei vastannut ajoissa. Muutoksesi voi silti tallentua. Päivitä sivu ennen kuin yrität uudelleen.",
  sv: "Tjänsten svarade inte i tid. Din ändring kan ändå sparas. Uppdatera sidan innan du försöker igen.",
};

function isMutation(operation: ApolloLink.Operation): boolean {
  const definition = getMainDefinition(operation.query);
  return definition.kind === Kind.OPERATION_DEFINITION && definition.operation === OperationTypeNode.MUTATION;
}

function toastNetworkError(error: ErrorLike, operation: ApolloLink.Operation): void {
  if (!isBrowser) {
    return;
  }
  // don't toast CSRF errors
  if (isCSRFError(error)) {
    return;
  }
  const lang = getLocalizationLang(document.documentElement.lang);
  const isMutationTimeout = isTimeoutError(error) && isMutation(operation);
  let errorMsg = isMutationTimeout ? MUTATION_TIMEOUT_TRANSLATIONS[lang] : NETWORK_ERROR_TRANSLATIONS[lang];

  const errorToastId = "network_error";

  // don't create multiple toasts
  if (!document.querySelector(`#${errorToastId}`)) {
    // Not translated because of how difficult it is to pass the translation function here
    if (ServerError.is(error) || ServerParseError.is(error)) {
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
  const decoded = cookie.split(";").map((x) => x.trim().split("="));
  const line = decoded.find((x) => x[0] === name);
  if (line == null) {
    return null;
  }
  const token = line[1];
  return token;
}

function getTimeoutMs(isServer: boolean, init: RequestInit | undefined, clientTimeoutMs: number): number {
  if (isServer) {
    return SERVER_FETCH_TIMEOUT_MS;
  }
  // The upload link sends files as multipart form data
  if (init?.body instanceof FormData) {
    return Math.max(clientTimeoutMs, CLIENT_UPLOAD_TIMEOUT_MS);
  }
  return clientTimeoutMs;
}

/// @param req - the incoming request, required on the server
/// @param clientTimeoutMs - timeout in the browser, the server always uses SERVER_FETCH_TIMEOUT_MS
export function enchancedFetch(req?: IncomingMessage, clientTimeoutMs: number = CLIENT_FETCH_TIMEOUT_MS) {
  return (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const isServer = typeof window === "undefined";
    const csrfToken = isServer ? getServerCookie(req?.headers, "csrftoken") : getCookie("csrftoken");

    const headers = new Headers(init?.headers);
    // missing csrf token is a non recoverable error
    if (csrfToken != null) {
      headers.set("X-Csrftoken", csrfToken);
    }

    // NOTE server requests don't include cookies by default
    if (isServer) {
      if (req == null) {
        throw new Error("request is required for server-side fetch");
      }
      if (req?.headers == null) {
        throw new Error("request headers must be defined for server-side fetch");
      }
      if (csrfToken == null) {
        throw new CsrfTokenNotFound();
      }
      headers.append("Cookie", `csrftoken=${csrfToken}`);
      // Django fails with 403 if there is no referer (only on Kubernetes)
      const requestUrl = req.url ?? "";
      // A TLS socket has "encrypted" set to true.
      const isEncrypted = req.socket != null && "encrypted" in req.socket && req.socket.encrypted === true;
      const requestProtocol = isEncrypted ? "https" : "http";
      headers.append("Referer", `${getClientOrigin(req.headers, requestProtocol) ?? ""}${requestUrl}`);
      // Forward the browser values, so backend logs and traces don't show the Node.js fetch defaults
      const userAgent = req.headers["user-agent"];
      if (userAgent != null) {
        headers.set("User-Agent", userAgent);
      }
      const acceptLanguage = req.headers["accept-language"];
      if (acceptLanguage != null) {
        headers.set("Accept-Language", acceptLanguage);
      }

      const sessionCookie = getServerCookie(req?.headers, "sessionid");
      if (sessionCookie != null) {
        headers.append("Cookie", `sessionid=${sessionCookie}`);
      }
    }

    return fetchWithTimeout(url, { ...init, headers }, getTimeoutMs(isServer, init, clientTimeoutMs));
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

export function logGraphQLError(error: QueryErrorT, operation?: ApolloLink.Operation): void {
  type SentryCtx = {
    level: "error";
    fingerprint?: string[];
    extra?: Record<string, string>;
  };
  const context: SentryCtx = {
    level: "error" as const,
  };
  let errorName: string = error.type;

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
        context.fingerprint = [
          "graphql_error",
          ...(operation?.operationName != null ? [operation.operationName] : []),
          ...codes,
        ];
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
      context.extra = {
        details: JSON.stringify(error),
      };
      context.fingerprint = ["connection_refused"];
      break;
    case "NON_API_ERROR":
      log.error(`other errors: ${JSON.stringify(error)}`);
      context.extra = {
        details: JSON.stringify(error),
      };
      context.fingerprint = ["non_api_error", error.message];
      break;
    case "CSRF_ERROR":
      log.error(`csrf error: ${error.message}`);
      context.fingerprint = ["csrf_error"];
      break;
    case "TIMEOUT":
      log.error(`timeout: ${error.message}`);
      context.fingerprint = ["timeout", ...(operation?.operationName != null ? [operation.operationName] : [])];
      errorName = `TIMEOUT: ${operation?.operationName ?? ""}`;
      break;
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

function getOperationName(doc: DocumentNode): string {
  return getOperationAST(doc)?.name?.value ?? "";
}

export function logGraphQLQuery(
  timeMs: number,
  url: string | undefined,
  documents: DocumentNode | DocumentNode[]
): void {
  const operationName = Array.isArray(documents)
    ? documents.map((doc) => getOperationName(doc))
    : getOperationName(documents);
  const t = Math.round(timeMs);
  const queryName = Array.isArray(operationName) ? operationName.join(",") : operationName;
  log.info(
    {
      timeMs: t,
      url,
      operationName,
    },
    `GQL query ${queryName} took: ${t} ms`
  );
}

function getNetworkErrorCode(error: Error): string | null {
  const { cause } = error;
  if (typeof cause === "object" && cause != null && "code" in cause && typeof cause.code === "string") {
    return cause.code;
  }
  return null;
}

/// Convert an error from Apollo (or any other error) to a QueryErrorT for logging
export function transformQueryError(error: unknown): QueryErrorT {
  if (CombinedGraphQLErrors.is(error)) {
    const gqlErrors = getApiErrors(error);
    const codes = new Set(gqlErrors.map((e) => e.code)).keys().toArray();
    const hasCode = codes.some((x) => x !== "UNKNOWN");
    const message = hasCode ? `Graphql VALIDATION errors: ${codes.join(",")}` : error.message;
    return {
      type: "GRAPHQL_ERROR",
      message,
      details: hasCode ? gqlErrors : [],
      errors: [...error.errors],
    };
  }
  if (isInvalidQueryError(error)) {
    return {
      type: "GRAPHQL_ERROR",
      message: error.message,
      details: [{ code: "INVALID_GRAPHQL_QUERY" }],
    };
  }
  if (isCSRFError(error)) {
    return {
      type: "CSRF_ERROR",
      message: "CSRF verfiication failed.",
    };
  }
  if (isTimeoutError(error)) {
    return {
      type: "TIMEOUT",
      message: error instanceof Error ? error.message : "",
    };
  }
  if (ServerError.is(error) || ServerParseError.is(error)) {
    return {
      type: "NETWORK_ERROR",
      code: String(error.statusCode),
      message: `${error.statusCode} fetch error ""`,
      details: error.bodyText,
    };
  }
  if (!(error instanceof Error)) {
    return {
      type: "NON_API_ERROR",
      message: `Unknown fetch error with details "${JSON.stringify(error)}"`,
    };
  }
  const code = getNetworkErrorCode(error);
  // The backend is down (nodejs version)
  if (code === "ECONNREFUSED") {
    return {
      type: "ECONNREFUSED",
      message: "Connection refused (backend down).",
    };
  }
  if (code != null) {
    return {
      type: "NETWORK_ERROR",
      code,
      message: `${code} fetch error`,
    };
  }
  if (error instanceof TypeError) {
    // Browser errors have zero info why it failed outside of message
    if (error.message.startsWith("Failed to fetch")) {
      return {
        type: "ECONNREFUSED",
        message: "Connection refused (backend down).",
      };
    }
    return {
      type: "NETWORK_ERROR",
      code: "UNKNOWN",
      message: `${error.name} fetch error with message ${error.message}`,
    };
  }
  return {
    type: "NON_API_ERROR",
    message: error.message,
    details: JSON.stringify(error),
  };
}
