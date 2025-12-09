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

export class CsrfTokenNotFound extends Error {
  constructor(message: string = "") {
    super(message);
    this.name = "CSRF Token not found";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CsrfTokenNotFound);
    }
  }
}

export class NotBrowserError extends Error {
  constructor(message: string = "") {
    super(message);
    this.name = "Not browser environment";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotBrowserError);
    }
  }
}

export function logError(err: unknown, level: "warning" | "error" = "error") {
  if (err instanceof GraphQLFetchError) {
    const ctx_extra = {
      data: JSON.stringify(err.data),
      operation: JSON.stringify(err.operation),
    };
    log({ ...ctx_extra, logLevel: level }, err.name);
    Sentry.captureException(err, { extra: ctx_extra, level });
  } else if (typeof err === "string") {
    log({ logLevel: level }, err);
    Sentry.captureMessage(err, level);
  } else {
    log({ logLevel: level }, `Exception: ${err}`);
    Sentry.captureException(err, { level });
  }
}
