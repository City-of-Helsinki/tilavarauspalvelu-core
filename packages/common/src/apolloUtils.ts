import { ApolloError } from "@apollo/client";
import { type GraphQLFormattedError } from "graphql";
import * as Sentry from "@sentry/nextjs";
import { onError } from "@apollo/client/link/error";
import toast from "./common/toast";
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
  overlapping: { begin: string; end: string }[];
}

function mapValidationError(
  gqlError: GraphQLFormattedError
): ValidationError[] {
  const { extensions } = gqlError;
  const code = getExtensionCode(gqlError);
  if (
    extensions != null &&
    "errors" in extensions &&
    Array.isArray(extensions.errors)
  ) {
    // field errors
    const { errors } = extensions;
    const errs = errors.map((err: unknown) => {
      if (typeof err !== "object" || err == null) {
        return null;
      }
      if (code != null && "message" in err && "field" in err) {
        const { message, field } = err ?? {};
        const validation_code = "code" in err ? err.code : null;
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
function mapOverlapError(gqlError: GraphQLFormattedError) {
  const { extensions } = gqlError;

  const code = getExtensionCode(gqlError);
  if (extensions != null && "overlapping" in extensions) {
    const { overlapping } = extensions ?? {};
    if (
      code == null ||
      !Array.isArray(overlapping) ||
      overlapping.length === 0
    ) {
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
    const fov = ov.filter(
      (e): e is { begin: string; end: string } => e != null
    );
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

function mapGraphQLErrors(
  graphQLErrors: readonly Readonly<GraphQLFormattedError>[]
): ApiError[] {
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

function getExtensionCode(e: GraphQLFormattedError): string | null {
  if (e.extensions == null) {
    return null;
  }
  if (
    e.extensions.error_code != null &&
    typeof e.extensions.error_code === "string"
  ) {
    return e.extensions.error_code;
  }
  // old extension name
  if (e.extensions.code != null && typeof e.extensions.code === "string") {
    return e.extensions.code;
  }
  return null;
}

function extractErrorCode(error: ApiError): string | string[] {
  if (
    "validation_code" in error &&
    error.validation_code != null &&
    typeof error.validation_code === "string"
  ) {
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
  const apiErrorCodes = apiErrors.map((e) => extractErrorCode(e)).flat();
  const context = {
    level: "warning" as const,
    // have to encode the errors [Object Object] otherwise
    extra: {
      ...(graphQLErrors != null
        ? { graphQLErrors: JSON.stringify(graphQLErrors) }
        : {}),
      ...(networkError != null
        ? { networkError: JSON.stringify(networkError) }
        : {}),
    },
    fingerprint: ["graphql_error", ...apiErrorCodes],
  };
  Sentry.captureMessage(`GraphQL error: ${apiErrorCodes.join(",")}`, context);

  if (networkError != null && isBrowser) {
    const errorToastId = "network_error";

    // don't create multiple toasts
    if (!document.querySelector(`#${errorToastId}`)) {
      // Not translated because of how difficult it is to pass the translation function here
      let errorMsg = "Network error";
      if ("statusCode" in networkError) {
        errorMsg += `: ${networkError.statusCode}`;
      }
      toast({
        text: errorMsg,
        type: "error",
        options: { toastId: errorToastId },
      });
    }
  }
  // During development (especially for SSR) log to console since there is no network tab
  // better method would be to use a logger / push errors to client side
  if (process.env.NODE_ENV === "development") {
    if (graphQLErrors) {
      for (const error of graphQLErrors) {
        // eslint-disable-next-line no-console
        console.error(`GQL_ERROR: ${JSON.stringify(error, null, 2)}`);
      }
    }

    if (networkError) {
      // eslint-disable-next-line no-console
      console.error(`NETWORK_ERROR: ${JSON.stringify(networkError, null, 2)}`);
    }
  }
});
