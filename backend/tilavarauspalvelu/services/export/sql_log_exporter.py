from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.models.request_log.model import RequestLog

from ._base_exporter import BaseCSVExporter, BaseExportRow

if TYPE_CHECKING:
    import datetime
    from collections.abc import Iterable

    from django.db import models

    from tilavarauspalvelu.models.request_log.queryset import RequestLogQuerySet

__all__ = [
    "SQLLogCSVExporter",
]


@dataclasses.dataclass
class SQLLogExportRow(BaseExportRow):
    request_id: str = ""
    path: str = ""
    body: str | None = ""
    duration_request: float | str = ""
    queries: int | str = ""
    created: datetime.datetime | str = ""
    sql: str = ""
    duration_sql: float | str = ""
    succeeded: bool | str = ""


class SQLLogCSVExporter(BaseCSVExporter):
    """Exports SQL logs to a CSV file."""

    def __init__(self, queryset: RequestLogQuerySet | None = None) -> None:
        self._queryset: RequestLogQuerySet = queryset or RequestLog.objects.all()

    @property
    def default_filename(self) -> str:
        return "sql_logs"

    @property
    def queryset(self) -> models.QuerySet:
        return self._queryset.prefetch_related("sql_logs").order_by("created")

    def get_header_rows(self) -> Iterable[SQLLogExportRow]:
        return [
            SQLLogExportRow(
                request_id="Request ID",
                path="Request Path",
                body="Request Body",
                duration_request="Request Duration (ms)",
                queries="Queries",
                created="Created",
                sql="SQL",
                duration_sql="SQL Duration (ms)",
                succeeded="SQL Succeeded?",
            ),
        ]

    def get_data_rows(self, instance: RequestLog) -> Iterable[SQLLogExportRow]:
        queries = 0
        total_duration = 0

        for sql_log in instance.sql_logs.all():
            queries += 1
            total_duration += sql_log.duration_ns
            yield SQLLogExportRow(
                request_id=str(instance.request_id),
                path=instance.path,
                sql=sql_log.sql,
                duration_sql=sql_log.duration_ns / 1_000_000,
                succeeded=sql_log.succeeded,
            )

        yield SQLLogExportRow(
            request_id=str(instance.request_id),
            path=instance.path,
            body=instance.body,
            duration_request=total_duration / 1_000_000,
            queries=queries,
            created=instance.created.isoformat(),
        )
