import contextlib
import logging
import time
import traceback
from collections.abc import Callable, Generator
from typing import Any

from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from django.db import connection
from django.http import HttpResponse

from common.typing import QueryInfo
from utils.sentry import SentryLogger

logger = logging.getLogger(__name__)


class MultipleProxyMiddleware:
    FORWARDED_FOR_FIELDS = [
        "HTTP_X_FORWARDED_FOR",
        "HTTP_X_FORWARDED_HOST",
        "HTTP_X_FORWARDED_SERVER",
    ]

    def __init__(self, get_response) -> None:
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


class GraphQLSentryMiddleware:
    def resolve(self, next_, root, info, **kwargs):
        try:
            return next_(root, info, **kwargs)
        except Exception as err:
            logger.info(traceback.format_exc())
            SentryLogger.log_exception(err, "Error in GraphQL query")
            return err


class QueryLoggingMiddleware:
    """Middleware that logs SQL queries made during the duration of a request."""

    def __init__(self, get_response: Callable[[WSGIRequest], HttpResponse]) -> None:
        self.get_response = get_response
        self.query_log: list[QueryInfo] = []

    def __call__(self, request: WSGIRequest) -> HttpResponse:
        skipped_route = any(request.path.startswith(path) for path in settings.QUERY_LOGGING_SKIP_ROUTES)
        if skipped_route or settings.QUERY_LOGGING_ENABLED is False:
            return self.get_response(request)

        with self.query_logger(request):
            return self.get_response(request)

    @contextlib.contextmanager
    def query_logger(self, request: WSGIRequest) -> Generator[None, None, None]:
        self.query_log = []
        with connection.execute_wrapper(self.log):
            yield

        try:
            from common.tasks import save_sql_queries_from_request

            save_sql_queries_from_request.delay(queries=self.query_log, path=request.path, body=request.body)
        except Exception as error:
            SentryLogger.log_exception(error, "Error in QueryLoggingMiddleware")

    def log(
        self,
        execute: Callable[..., Any],
        sql: str,
        params: tuple[Any, ...],
        many: bool,
        context: dict[str, Any],
    ) -> Any:
        query_info = QueryInfo(sql=sql, duration_ns=0, succeeded=True)
        self.query_log.append(query_info)

        start = time.perf_counter_ns()
        try:
            result = execute(sql, params, many, context)
        except Exception:
            query_info["succeeded"] = False
            raise
        finally:
            query_info["duration_ns"] = time.perf_counter_ns() - start

        return result
