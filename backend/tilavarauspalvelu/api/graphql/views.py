from __future__ import annotations

from typing import TYPE_CHECKING, Any

import sentry_sdk
from graphene_django_extensions import FileUploadGraphQLView
from sentry_sdk.tracing import TransactionSource

if TYPE_CHECKING:
    from django.http import HttpRequest
    from graphql import ExecutionResult

__all__ = [
    "SentryGraphQLView",
]


class SentryGraphQLView(FileUploadGraphQLView):
    """
    Name the Sentry transaction and span of a GraphQL request with its operation name.

    Sentry's GrapheneIntegration patches only 'graphene.Schema.execute'.
    graphene-django calls graphql-core directly, so without this view every request is only '/graphql/'.
    """

    def execute_graphql_request(
        self,
        request: HttpRequest,
        data: dict[str, Any],
        query: str | None,
        variables: dict[str, Any] | None,
        operation_name: str | None,
        show_graphiql: bool = False,  # noqa: FBT001, FBT002
    ) -> ExecutionResult | None:
        if not query:
            return super().execute_graphql_request(request, data, query, variables, operation_name, show_graphiql)

        span_name = operation_name or "<unknown operation>"

        scope = sentry_sdk.get_current_scope()
        scope.set_transaction_name(f"/graphql/ {span_name}", source=TransactionSource.CUSTOM)

        with sentry_sdk.start_span(op="graphql.execute", name=span_name) as span:
            span.set_data("graphql.operation.name", span_name)
            return super().execute_graphql_request(request, data, query, variables, operation_name, show_graphiql)
