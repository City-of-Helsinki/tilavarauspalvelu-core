// oxlint-disable max-classes-per-file
import type { GqlQuery } from "@ui/middlewareHelpers";

export class EconnRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ECONNREFUSED";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EconnRefusedError);
    }
  }
}

export class GraphQLFetchError extends Error {
  data: unknown;
  operation: GqlQuery;
  constructor(status: number, statusText: string, operation: GqlQuery, data: unknown) {
    super(`GraphQLFetchError ${status} ${statusText}`);

    this.name = "GraphQLFetchError ";
    this.data = data;
    this.operation = operation;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLFetchError);
    }
  }
}
