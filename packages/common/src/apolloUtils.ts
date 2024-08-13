import { ApolloError } from "@apollo/client";
import { type GraphQLErrors } from "@apollo/client/errors";

type ValidationError = {
  message: string | null;
  code: string;
  field: string | null;
};

type OverlappingError = {
  overlapping: { begin: string; end: string }[];
  code: string;
};

function mapValidationError(gqlError: GraphQLErrors[0]): ValidationError[] {
  const { extensions } = gqlError;
  if ("errors" in extensions && Array.isArray(extensions.errors)) {
    // field errors
    const { errors } = extensions;
    const errs = errors.map((err: unknown) => {
      if (typeof err !== "object" || err == null) {
        return null;
      }
      if ("message" in err && "code" in err && "field" in err) {
        const { message, code, field } = err ?? {};
        if (typeof code !== "string") {
          return null;
        }
        return {
          code,
          message: typeof message !== "string" ? null : message,
          field: typeof field !== "string" ? null : field,
        };
      }
      return null;
    });
    return errs.filter((e): e is ValidationError => e != null);
  } else if ("code" in extensions) {
    // permission errors (non field errors)
    const { code } = extensions;
    if (typeof code !== "string") {
      return [];
    }
    return [
      {
        code,
        message: null,
        field: null,
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
export function getPermissionErrors(error: unknown): ValidationError[] {
  if (error == null) {
    return [];
  }

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const hasExtension = (e: (typeof graphQLErrors)[0]) => {
        if (e.extensions == null) {
          return false;
        }
        return (
          PERMISSION_ERROR_CODES.find((x) => x === e.extensions.code) != null
        );
      };
      return graphQLErrors.filter(hasExtension).flatMap(mapValidationError);
    }
  }
  return [];
}

export function getValidationErrors(error: unknown): ValidationError[] {
  if (error == null) {
    return [];
  }

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      // TODO separate validation errors: this is invalid form values (user error)
      const MUTATION_ERROR_CODE = "MUTATION_VALIDATION_ERROR";
      const isMutationError = (e: (typeof graphQLErrors)[0]) => {
        if (e.extensions == null) {
          return false;
        }
        return e.extensions.code === MUTATION_ERROR_CODE;
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
function mapOverlapError(gqlError: GraphQLErrors[0]) {
  const { extensions } = gqlError;

  if ("overlapping" in extensions && "code" in extensions) {
    const { overlapping, code } = extensions ?? {};
    if (
      typeof code !== "string" ||
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

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const CODE = "RESERVATION_SERIES_OVERLAPS";
      const isSpecificError = (e: (typeof graphQLErrors)[0]) => {
        if (e.extensions == null) {
          return false;
        }
        return e.extensions.code === CODE;
      };
      return graphQLErrors.filter(isSpecificError).flatMap(mapOverlapError);
    }
  }
  return [];
}
