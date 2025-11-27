// oxlint-disable max-classes-per-file
import * as Sentry from "@sentry/nextjs";
import { Roarr as log } from "roarr";
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

export function logError(err: unknown) {
  if (err instanceof GraphQLFetchError) {
    const ctx_extra = {
      data: JSON.stringify(err.data),
      operation: JSON.stringify(err.operation),
    };
    log.error(ctx_extra, err.name);
    Sentry.captureException(err, { extra: ctx_extra });
  } else if (typeof err === "string") {
    log.error(err);
    Sentry.captureMessage(err, "error");
  } else {
    log.error(`Exception: ${err}`);
    Sentry.captureException(err);
  }
}
