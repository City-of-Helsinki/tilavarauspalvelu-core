import { ApolloError } from "@apollo/client";
import { type GraphQLErrors } from "@apollo/client/errors";

type ValidationError = {
  message: string | null;
  code: string;
  field: string | null;
};

function mapGQLErrors(gqlError: GraphQLErrors[0]): ValidationError[] {
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
      return graphQLErrors.filter(hasExtension).flatMap(mapGQLErrors);
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
      return graphQLErrors.filter(isMutationError).flatMap(mapGQLErrors);
    }
  }
  return [];
}
