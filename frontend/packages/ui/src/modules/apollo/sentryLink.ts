import type { FetchResult, NextLink, Operation } from "@apollo/client";
import { ApolloLink, Observable } from "@apollo/client";
import * as Sentry from "@sentry/nextjs";

export class SentryContextLink extends ApolloLink {
  request(operation: Operation, forward?: NextLink): Observable<FetchResult> | null {
    const span = Sentry.getActiveSpan();
    const name = `GRAPHQL: ${operation.operationName}`;
    let gqlSpan = null;
    if (span) {
      gqlSpan = Sentry.startInactiveSpan({ name, op: "graphql" });
      span.setAttributes({
        operation_name: operation.operationName,
      });
    }

    if (forward == null) {
      return null;
    }
    return new Observable((observer) => {
      const observable = forward(operation);
      const subscription = observable.subscribe({
        next(value) {
          observer.next(value);
        },
        error(networkError) {
          observer.error(networkError);
        },
        complete() {
          gqlSpan?.end();
          observer.complete();
        },
      });
      return () => subscription.unsubscribe();
    });
  }
}
