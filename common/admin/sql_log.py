import uuid

import sqlparse
from django.contrib import admin, messages
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.http import FileResponse
from django.utils.safestring import SafeString, mark_safe
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateTimeRangeFilter

from common.admin.forms import SQLLogAdminForm
from common.admin.forms.sql_log import RequestLogAdminForm, SQLLogAdminInlineForm
from common.exporter.sql_log_exporter import SQLLogCSVExporter
from common.models import RequestLog, SQLLog
from common.querysets.sql_log import RequestLogQuerySet, SQLLogQuerySet
from utils.sentry import SentryLogger


@admin.register(SQLLog)
class SQLLogAdmin(admin.ModelAdmin):
    form = SQLLogAdminForm
    list_display = [
        "_sql",
        "_path",
        "_request_id",
        "_duration_ms",
    ]
    readonly_fields = [
        "_sql",
        "request_log",
        "_duration_ms",
        "succeeded",
    ]
    list_filter = [
        "request_log__path",
        "succeeded",
        ("request_log__created", DateTimeRangeFilter),
    ]
    search_fields = [
        "sql",
        "request_log__path",
        "request_log__body",
        "request_log__request_id",
    ]

    def get_queryset(self, request: WSGIRequest) -> SQLLogQuerySet:
        return super().get_queryset(request).select_related("request_log")

    @admin.display(description=_("SQL"), ordering="sql")
    def _sql(self, obj: SQLLog) -> SafeString:
        sql = sqlparse.format(obj.sql, reindent=True, keyword_case="upper")
        return mark_safe(f"<pre>{sql}</pre>")  # noqa: S308  # nosec  # NOSONAR

    @admin.display(description=_("Path"), ordering="request_log__path")
    def _path(self, obj: SQLLog) -> str:
        return obj.request_log.path

    @admin.display(description=_("Request ID"), ordering="request_log__request_id")
    def _request_id(self, obj: SQLLog) -> uuid.UUID:
        return obj.request_log.request_id

    @admin.display(description=_("Duration (ms)"), ordering="duration_ns")
    def _duration_ms(self, obj: SQLLog) -> str:
        value = obj.duration_ns / 1_000_000
        return f"~{value:_.2f}".replace("_", " ")

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False


class SQLLogAdminInline(admin.TabularInline):
    model = SQLLog
    form = SQLLogAdminInlineForm
    readonly_fields = ["_sql"]
    extra = 0
    can_delete = False
    show_change_link = True

    @admin.display(description=_("SQL"), ordering="sql")
    def _sql(self, obj: SQLLog) -> SafeString:
        sql = sqlparse.format(obj.sql, reindent=True, keyword_case="upper")
        return mark_safe(f"<pre>{sql}</pre>")  # noqa: S308  # nosec  # NOSONAR

    def has_add_permission(self, request: WSGIRequest, obj: SQLLog) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    form = RequestLogAdminForm
    inlines = [SQLLogAdminInline]
    list_display = [
        "request_id",
        "path",
        "num_of_sql_logs",
        "_duration_ms",
        "created",
    ]
    readonly_fields = [
        "request_id",
        "path",
        "_body",
        "_duration_ms",
        "created",
    ]
    list_filter = [
        "path",
        ("created", DateTimeRangeFilter),
    ]
    search_fields = [
        "request_id",
        "path",
        "body",
    ]
    actions = [
        "export_results_to_csv",
    ]

    @admin.display(description=_("Queries"), ordering="queries")
    def num_of_sql_logs(self, obj: RequestLog) -> int:
        return getattr(obj, "queries", -1)

    @admin.display(description=_("Duration (ms)"), ordering="total_duration")
    def _duration_ms(self, obj: RequestLog) -> str:
        if obj.duration_ms:
            return f"{obj.duration_ms:_.2f}".replace("_", " ")

        value = getattr(obj, "total_duration", 0) / 1_000_000
        return f"~{value:_.2f}".replace("_", " ")

    @admin.display(description=_("Body"), ordering="body")
    def _body(self, obj: RequestLog) -> SafeString:
        return mark_safe(f"<pre>{obj.body}</pre>")  # noqa: S308  # nosec  # NOSONAR

    def get_queryset(self, request: WSGIRequest) -> RequestLogQuerySet:
        return (
            super()
            .get_queryset(request)
            .prefetch_related("sql_logs")
            .annotate(
                queries=models.Count("sql_logs"),
                total_duration=models.Sum("sql_logs__duration_ns"),
            )
        )

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False

    @admin.action(description=_("Export rows to CSV"))
    def export_results_to_csv(self, request: WSGIRequest, queryset: RequestLogQuerySet) -> FileResponse | None:
        exporter = SQLLogCSVExporter(queryset=queryset)
        try:
            response = exporter.export_as_file_response()
        except Exception as err:
            self.message_user(request, f"Error while exporting results: {err}", level=messages.ERROR)
            SentryLogger.log_exception(err, "Error while exporting SQL log results")
            return None

        if not response:
            self.message_user(request, "No data to export.", level=messages.WARNING)

        return response
