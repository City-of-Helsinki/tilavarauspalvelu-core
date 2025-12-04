import type { FetchResult, NextLink, Operation } from "@apollo/client";
import { ApolloLink, Observable } from "@apollo/client";
import * as Sentry from "@sentry/nextjs";

export class SentryContextLink extends ApolloLink {
  request(operation: Operation, forward?: NextLink): Observable<FetchResult> | null {
    const name = `GRAPHQL: ${operation.operationName}`;
    const gqlSpan = Sentry.startInactiveSpan({ name, op: "graphql" });

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
