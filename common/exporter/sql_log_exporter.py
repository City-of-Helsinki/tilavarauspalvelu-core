import csv
import dataclasses
import datetime
from collections.abc import Iterable, Iterator
from io import StringIO

from django.http import FileResponse

from common.models import RequestLog
from common.querysets.sql_log import RequestLogQuerySet


@dataclasses.dataclass
class SQLLogExportRow:
    request_id: str = ""
    path: str = ""
    body: str | None = ""
    duration_request: float | str = ""
    queries: int | str = ""
    created: datetime.datetime | str = ""
    sql: str = ""
    duration_sql: float | str = ""
    succeeded: bool | str = ""

    def __iter__(self) -> Iterator[str]:
        return iter(dataclasses.asdict(self).values())


class SQLLogCSVExporter:
    def __init__(self, queryset: RequestLogQuerySet) -> None:
        self.queryset = queryset.prefetch_related("sql_logs").order_by("created")

    def export(self) -> StringIO | None:
        csv_file = StringIO()
        csv_writer = csv.writer(csv_file)

        csv_writer.writerow(self._get_header_row())

        # Write data rows
        for item in self.queryset:
            for row in self._process_instance(item):
                csv_writer.writerow(row)

        return csv_file

    def export_as_file_response(self) -> FileResponse | None:
        csv_file = self.export()
        if csv_file is None:
            return None

        file_name = "sql_logs.csv"
        response = FileResponse(csv_file.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f"attachment;filename={file_name}"
        return response

    def _get_header_row(self) -> SQLLogExportRow:
        return SQLLogExportRow(
            request_id="Request ID",
            path="Request Path",
            body="Request Body",
            duration_request="Request Duration (ms)",
            queries="Queries",
            created="Created",
            sql="SQL",
            duration_sql="SQL Duration (ms)",
            succeeded="SQL Succeeded?",
        )

    def _process_instance(self, instance: RequestLog) -> Iterable[SQLLogExportRow]:
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
