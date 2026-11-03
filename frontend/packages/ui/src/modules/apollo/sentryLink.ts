import { ApolloLink, Observable } from "@apollo/client";
import { SPAN_STATUS_ERROR } from "@sentry/core";
import * as Sentry from "@sentry/nextjs";
import type { FetchResult, NextLink, Operation } from "@apollo/client";

export class SentryContextLink extends ApolloLink {
  request(operation: Operation, forward?: NextLink): Observable<FetchResult> | null {
    if (forward == null) {
      return null;
    }
    return new Observable((observer) => {
      const name = `GRAPHQL: ${operation.operationName}`;
      const gqlSpan = Sentry.startInactiveSpan({ name, op: "graphql" });
      // The terminating link calls fetch when it is subscribed.
      // Subscribe inside the active span, so the fetch span becomes its child.
      const subscription = Sentry.withActiveSpan(gqlSpan, () =>
        forward(operation).subscribe({
          next(value) {
            observer.next(value);
          },
          error(networkError) {
            gqlSpan.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
            observer.error(networkError);
          },
          complete() {
            observer.complete();
          },
        })
      );
      // The teardown runs after complete, after error, and when the caller unsubscribes.
      return () => {
        subscription.unsubscribe();
        gqlSpan.end();
      };
    });
  }
}
