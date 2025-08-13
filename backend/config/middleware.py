import logging
from collections.abc import Callable
from typing import Any

from django.conf import settings
from django.core.signals import got_request_exception
from django.http import HttpResponse
from graphql import GraphQLFieldResolver, GraphQLResolveInfo

from tilavarauspalvelu.typing import WSGIRequest

logger = logging.getLogger(__name__)


class MultipleProxyMiddleware:
    FORWARDED_FOR_FIELDS = [
        "HTTP_X_FORWARDED_FOR",
        "HTTP_X_FORWARDED_HOST",
        "HTTP_X_FORWARDED_SERVER",
    ]

    def __init__(self, get_response: Callable[[WSGIRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: WSGIRequest) -> HttpResponse:
        if not settings.MULTI_PROXY_HEADERS:
            return self.get_response(request)
        """
        Rewrites the proxy headers so that only the most
        recent proxy is used.
        """
        for field in self.FORWARDED_FOR_FIELDS:
            if field in request.META and "," in request.META[field]:
                parts = request.META[field].split(",")
                request.META[field] = parts[-1].strip()

        """
        Rewrites the X Original Host to X Forwarded Host header
        """
        if "HTTP_X_ORIGINAL_HOST" in request.META:
            request.META["HTTP_X_FORWARDED_HOST"] = request.META["HTTP_X_ORIGINAL_HOST"]
        return self.get_response(request)


class KeycloakRefreshTokenExpiredMiddleware:
    def __init__(self, get_response: Callable[[WSGIRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: WSGIRequest) -> HttpResponse:
        response = self.get_response(request)
        if "keycloak_refresh_token_expired" in request.session:
            response["X-Keycloak-Refresh-Token-Expired"] = "true"
        return response


def graphql_sentry_middleware(
    resolver: GraphQLFieldResolver,
    root: Any,
    info: GraphQLResolveInfo,
    **kwargs: Any,
) -> Any:
    try:
        return resolver(root, info, **kwargs)
    except Exception as err:  # noqa: BLE001
        # Send the exception to `tilavarauspalvelu.signals._sentry_log_exception`
        got_request_exception.send(sender=None, request=info.context)
        return err
