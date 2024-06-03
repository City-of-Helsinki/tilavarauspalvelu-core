import contextlib
import logging
import time
import traceback
from collections.abc import Callable, Generator
from functools import partial
from typing import Any

from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from django.db import connection
from django.http import HttpResponse
from pyinstrument import Profiler
from pyinstrument.renderers import HTMLRenderer, SpeedscopeRenderer

from common.date_utils import local_datetime
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
            SentryLogger.log_exception(err, "Error in GraphQL query")
            return err


class GraphQLErrorLoggingMiddleware:
    def resolve(self, next_, root, info, **kwargs):
        try:
            return next_(root, info, **kwargs)
        except Exception as err:
            logger.info(traceback.format_exc())
            return err


class QueryLoggingMiddleware:
    """Middleware that logs SQL queries made during the duration of a request."""

    def __init__(self, get_response: Callable[[WSGIRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: WSGIRequest) -> HttpResponse:
        skipped_route = any(request.path.startswith(path) for path in settings.QUERY_LOGGING_SKIP_ROUTES)
        if skipped_route or settings.QUERY_LOGGING_ENABLED is False:
            return self.get_response(request)

        with self.query_logger(request):
            return self.get_response(request)

    @contextlib.contextmanager
    def query_logger(self, request: WSGIRequest) -> Generator[None, None, None]:
        query_log = []
        start = time.perf_counter_ns()
        try:
            with connection.execute_wrapper(partial(self.log, query_log=query_log)):
                yield
        finally:
            try:
                from common.tasks import save_sql_queries_from_request

                # TODO: instead of saving all queries to graphql, only save when optimizer
                #  counted different number of queries than what was actually executed.
                save_sql_queries_from_request.delay(
                    queries=query_log,
                    path=request.path,
                    body=request.body,
                    duration_ms=(time.perf_counter_ns() - start) // 1_000_000,
                )
            except Exception as error:
                SentryLogger.log_exception(error, "Error in QueryLoggingMiddleware")

    def log(
        self,
        execute: Callable[..., Any],
        sql: str,
        params: tuple[Any, ...],
        many: bool,
        context: dict[str, Any],
        query_log: list[QueryInfo],
    ) -> Any:
        query_info = QueryInfo(sql=sql, duration_ns=0, succeeded=True)
        query_log.append(query_info)

        start = time.perf_counter_ns()
        try:
            result = execute(sql, params, many, context)
        except Exception:
            query_info["succeeded"] = False
            raise
        finally:
            query_info["duration_ns"] = time.perf_counter_ns() - start

        return result


class ProfilerMiddleware:
    def __init__(self, get_response: Callable[[WSGIRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: WSGIRequest) -> HttpResponse:
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
        with open(f"graphql-{t}.{sc_renderer.output_file_extension}", mode="w", encoding="utf-8") as file:
            file.write(output_sc)
        with open(f"graphql-{t}.{html_renderer.output_file_extension}", mode="w", encoding="utf-8") as file:
            file.write(output_html)

        return response
