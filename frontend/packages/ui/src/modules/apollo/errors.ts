import { CombinedGraphQLErrors, LinkError, ServerError, ServerParseError } from "@apollo/client/errors";
import { z } from "zod";
import type { GraphQLFormattedError } from "graphql";
import { getConnectionErrorCode, isTimeoutError } from "../fetch";

/// An error code from the backend (in the GraphQL error extensions)
export interface ApiError {
  code: string;
}

export interface ValidationError extends ApiError {
  message: string | null;
  field: string | null;
  validation_code: string | null;
}

export interface OverlappingError extends ApiError {
  overlapping: Array<{ begin: string; end: string }>;
}

const MUTATION_VALIDATION_ERROR = "MUTATION_VALIDATION_ERROR";
const RESERVATION_SERIES_OVERLAPS = "RESERVATION_SERIES_OVERLAPS";
const PERMISSION_ERROR_CODES = new Set([
  "UPDATE_PERMISSION_DENIED",
  "CREATE_PERMISSION_DENIED",
  "DELETE_PERMISSION_DENIED",
  "MUTATION_PERMISSION_DENIED",
  "NODE_PERMISSION_DENIED",
  "FILTER_PERMISSION_DENIED",
]);

export function isPermissionErrorCode(code: string): boolean {
  return PERMISSION_ERROR_CODES.has(code);
}

const FieldErrorSchema = z.object({
  message: z.string().nullish(),
  field: z.string().nullish(),
  code: z.string().nullish(),
});

const OverlapSchema = z.object({ begin: z.string(), end: z.string() });

/// The value if it matches the schema, else undefined.
/// Each extension field is parsed on its own, so an unexpected value in one field does not hide the others.
function parseOrUndefined<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

/// The items of a list that match the schema
function parseList<T>(schema: z.ZodType<T>, value: unknown): T[] | undefined {
  return parseOrUndefined(z.array(z.unknown()), value)?.flatMap((item) => parseOrUndefined(schema, item) ?? []);
}

function toApiErrors(error: GraphQLFormattedError): ApiError[] {
  const extensions = error.extensions ?? {};
  // "code" is the old name of "error_code"
  const code = parseOrUndefined(z.string(), extensions.error_code) ?? parseOrUndefined(z.string(), extensions.code);
  if (code === RESERVATION_SERIES_OVERLAPS) {
    const overlapping = parseList(OverlapSchema, extensions.overlapping) ?? [];
    const overlapError: OverlappingError = { code, overlapping };
    return overlapping.length > 0 ? [overlapError] : [];
  }
  if (code === MUTATION_VALIDATION_ERROR || (code != null && isPermissionErrorCode(code))) {
    const fieldErrors = parseList(FieldErrorSchema, extensions.errors);
    if (fieldErrors == null) {
      const validationError: ValidationError = { code, message: null, field: null, validation_code: null };
      return [validationError];
    }
    return fieldErrors.map((e): ValidationError => ({
      code,
      message: e.message ?? null,
      field: e.field ?? null,
      validation_code: e.code || null,
    }));
  }
  return [{ code: code ?? "UNKNOWN" }];
}

/// The backend error codes in a GraphQL error. Empty for any other error.
export function getApiErrors(error: unknown): ApiError[] {
  return CombinedGraphQLErrors.is(error) ? error.errors.flatMap(toApiErrors) : [];
}

export function getValidationErrors(error: unknown): ValidationError[] {
  return getApiErrors(error).filter((e): e is ValidationError => e.code === MUTATION_VALIDATION_ERROR);
}

export function getPermissionErrors(error: unknown): ValidationError[] {
  return getApiErrors(error).filter((e): e is ValidationError => isPermissionErrorCode(e.code));
}

export function getSeriesOverlapErrors(error: unknown): OverlappingError[] {
  return getApiErrors(error).filter((e): e is OverlappingError => e.code === RESERVATION_SERIES_OVERLAPS);
}

export function isNotFoundError(error: unknown): boolean {
  return getApiErrors(error).some((e) => e.code === "NOT_FOUND");
}

/// What went wrong in a backend request
export type FetchError =
  /// The backend returned errors in the GraphQL response
  | { kind: "graphql"; errors: ApiError[]; graphQLErrors: ReadonlyArray<GraphQLFormattedError> }
  /// The backend did not accept the query (a bug in the frontend)
  | { kind: "invalid_query"; body: string }
  | { kind: "csrf" }
  /// No response in time (see fetchWithTimeout)
  | { kind: "timeout" }
  /// No connection to the backend, for example the backend is down or restarts
  | { kind: "connection"; code: string }
  /// A response that is not a GraphQL response, for example a 502 from the gateway
  | { kind: "http"; status: number; body: string }
  | { kind: "unknown"; message: string };

// Browsers give no reason when fetch fails, only one of these messages
const BROWSER_FETCH_FAILED_MESSAGES = [
  "Failed to fetch", // Chrome
  "NetworkError when attempting to fetch resource", // Firefox
  "Load failed", // Safari
];

function isCsrfFailure(error: ServerError): boolean {
  if (error.statusCode !== 403) {
    return false;
  }
  try {
    const body: unknown = JSON.parse(error.bodyText);
    return typeof body === "object" && body != null && "code" in body && body.code === "CSRF_FAILURE";
  } catch {
    return false;
  }
}

/// Find out what went wrong in a backend request
/// @param error - an error from Apollo Client or from fetch
export function classifyError(error: unknown): FetchError {
  if (CombinedGraphQLErrors.is(error)) {
    return { kind: "graphql", errors: getApiErrors(error), graphQLErrors: error.errors };
  }
  if (ServerError.is(error)) {
    // graphene-django returns 400 only when the query is not valid, errors in the resolvers return 200
    if (error.statusCode === 400) {
      return { kind: "invalid_query", body: error.bodyText };
    }
    if (isCsrfFailure(error)) {
      return { kind: "csrf" };
    }
    return { kind: "http", status: error.statusCode, body: error.bodyText };
  }
  if (ServerParseError.is(error)) {
    return { kind: "http", status: error.statusCode, body: error.bodyText };
  }
  if (isTimeoutError(error)) {
    return { kind: "timeout" };
  }
  const code = getConnectionErrorCode(error);
  if (code != null) {
    return { kind: "connection", code };
  }
  if (error instanceof TypeError && BROWSER_FETCH_FAILED_MESSAGES.some((msg) => error.message.startsWith(msg))) {
    return { kind: "connection", code: "BROWSER_FETCH_FAILED" };
  }
  if (error instanceof Error) {
    return { kind: "unknown", message: `${error.name}: ${error.message}` };
  }
  return { kind: "unknown", message: String(error) };
}

/// True if the error came from a backend request.
/// The error link logs these, so the caller does not have to log them again.
export function isRequestError(error: unknown): boolean {
  return CombinedGraphQLErrors.is(error) || LinkError.is(error);
}
