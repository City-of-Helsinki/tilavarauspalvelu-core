import type { FetchResult, NextLink, Observable, Operation } from "@apollo/client";
import { ApolloLink } from "@apollo/client";
import * as Sentry from "@sentry/nextjs";

export class SentryContextLink extends ApolloLink {
  request(operation: Operation, forward?: NextLink): Observable<FetchResult> | null {
    const span = Sentry.getActiveSpan();
    if (span) {
      span.setAttributes({
        operation_name: operation.operationName,
      });
    }

    return forward?.(operation) ?? null;
  }
}
