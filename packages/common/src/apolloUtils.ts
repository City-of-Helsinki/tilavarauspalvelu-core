import { ApolloError } from "@apollo/client";
import { type GraphQLErrors } from "@apollo/client/errors";

type ValidationError = {
  message: string;
  code: string;
  field: string;
};

function mapGQLErrors(gqlError: GraphQLErrors[0]) {
  const { extensions } = gqlError;
  if ("errors" in extensions && Array.isArray(extensions.errors)) {
    const { errors } = extensions;
    const errs = errors.map((err: unknown) => {
      if (typeof err !== "object" || err == null) {
        return null;
      }
      if ("message" in err && "code" in err && "field" in err) {
        const { message, code, field } = err ?? {};
        if (
          typeof message !== "string" ||
          typeof code !== "string" ||
          typeof field !== "string"
        ) {
          return null;
        }
        return { message, code, field };
      }
      return null;
    });
    return errs.filter((e): e is ValidationError => e != null);
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
