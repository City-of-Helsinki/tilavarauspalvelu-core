from __future__ import annotations

import dataclasses
import json
from contextlib import suppress
from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import RequestLog, SQLLog

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import QueryInfo


__all__ = [
    "SQLLogActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SQLLogActions:
    sql_log: SQLLog

    @classmethod
    def create_for_request(cls, queries: list[QueryInfo], path: str, body: bytes, duration_ms: int) -> None:
        decoded_body: str | None = None
        if path.startswith("/graphql"):
            with suppress(Exception):
                decoded_body = body.decode()
            if decoded_body:
                data = json.loads(decoded_body)
                decoded_body = data.get("query")

        request_log = RequestLog.objects.create(
            path=path,
            body=decoded_body,
            duration_ms=duration_ms,
        )
        sql_logs = [
            SQLLog(
                request_log=request_log,
                sql=query["sql"],
                succeeded=query["succeeded"],
                duration_ns=query["duration_ns"],
                stack_info=query["stack_info"],
            )
            for query in queries
        ]
        SQLLog.objects.bulk_create(sql_logs)

        cls._log_to_sentry_if_suspicious(request_log, duration_ms)

    @classmethod
    def _log_to_sentry_if_suspicious(cls, request_log: RequestLog, duration_ms: int) -> None:
        if duration_ms >= settings.QUERY_LOGGING_DURATION_MS_THRESHOLD:
            msg = "Request took too suspiciously long to complete"
            details = {
                "request_log": request_log.request_id,
                "duration": duration_ms,
            }
            SentryLogger.log_message(msg, details=details, level="warning")

        if request_log.body and (body_length := len(request_log.body)) >= settings.QUERY_LOGGING_BODY_LENGTH_THRESHOLD:
            msg = "Body of request is too suspiciously large"
            details = {
                "request_log": request_log.request_id,
                "body_length": body_length,
            }
            SentryLogger.log_message(msg, details=details, level="warning")

        if num_of_queries := request_log.sql_logs.count() >= settings.QUERY_LOGGING_QUERY_COUNT_THRESHOLD:
            msg = "Request made suspiciously many queries"
            details = {
                "request_log": request_log.request_id,
                "num_of_queries": num_of_queries,
            }
            SentryLogger.log_message(msg, details=details, level="warning")
