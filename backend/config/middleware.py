from __future__ import annotations

import logging
import traceback
from pathlib import Path
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.signals import got_request_exception
from graphql import GraphQLFieldResolver

from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from collections.abc import Callable

    from django.http import HttpResponse

    from tilavarauspalvelu.typing import GQLInfo, WSGIRequest


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


class GraphQLSentryMiddleware:
    def resolve(self, next_: GraphQLFieldResolver, root: Any, info: GQLInfo, **kwargs: Any) -> Any:
        try:
            return next_(root, info, **kwargs)
        except Exception as err:  # noqa: BLE001
            # Send the exception to `tilavarauspalvelu.signals.sentry_log_exception`
            got_request_exception.send(sender=None, request=info.context)
            return err


class GraphQLErrorLoggingMiddleware:
    def resolve(self, next_: GraphQLFieldResolver, root: Any, info: GQLInfo, **kwargs: Any) -> Any:
        try:
            return next_(root, info, **kwargs)
        except Exception as err:  # noqa: BLE001
            logger.info(traceback.format_exc())
            return err


class ProfilerMiddleware:
    def __init__(self, get_response: Callable[[WSGIRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: WSGIRequest) -> HttpResponse:
        from pyinstrument import Profiler
        from pyinstrument.renderers import HTMLRenderer, SpeedscopeRenderer

        if not request.path.startswith("/graphql") or not bool(request.headers.get("X-Profiler", "")):
            return self.get_response(request)

        profiler = Profiler()
        sc_renderer = SpeedscopeRenderer()
        html_renderer = HTMLRenderer()

        profiler.start()
        response = self.get_response(request)
        profile_session = profiler.stop()

        output_sc = sc_renderer.render(profile_session)
        output_html = html_renderer.render(profile_session)

        t = local_datetime().strftime("%Y-%m-%dT%H-%M-%S")
        with Path(f"graphql-{t}.{sc_renderer.output_file_extension}").open(mode="w", encoding="utf-8") as file:
            file.write(output_sc)
        with Path(f"graphql-{t}.{html_renderer.output_file_extension}").open(mode="w", encoding="utf-8") as file:
            file.write(output_html)

        return response
