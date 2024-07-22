import re
import uuid

from django.contrib import admin, messages
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.db.models.functions import Coalesce
from django.http import FileResponse
from django.utils.safestring import SafeString, mark_safe
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateTimeRangeFilter, DateTimeRangeFilterBuilder, NumericRangeFilterBuilder

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
        "_sql_display",
        "_path",
        "_request_id",
        "_duration_ms",
    ]
    readonly_fields = [
        "_sql",
        "request_log",
        "_duration_ms",
        "succeeded",
        "_stack_info",
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
    search_help_text = _("Search by SQL, request log path, body or request ID")

    def get_queryset(self, request: WSGIRequest) -> SQLLogQuerySet:
        return super().get_queryset(request).select_related("request_log")

    @admin.display(description=_("SQL"), ordering="sql")
    def _sql_display(self, obj: SQLLog) -> SafeString:
        return mark_safe(f"<pre>{obj.sql_formatted}</pre>")  # noqa: S308  # nosec  # NOSONAR

    @admin.display(description=_("SQL"), ordering="sql")
    def _sql(self, obj: SQLLog) -> SafeString:
        title = "Show query"
        val = f"""
        <details>
          <summary style="cursor: pointer">{title}</summary>
          <pre>{obj.sql_formatted}</pre>
        </details>
        """
        return mark_safe(val)  # noqa: S308  # nosec  # NOSONAR

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

    @admin.display(description=_("Stack Info"), ordering="stack_info")
    def _stack_info(self, obj: SQLLog) -> SafeString:
        return mark_safe(f"<pre>{obj.stack_info}</pre>")  # noqa: S308  # nosec  # NOSONAR

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False


class SQLLogAdminInline(admin.StackedInline):
    model = SQLLog
    form = SQLLogAdminInlineForm
    readonly_fields = ["_sql", "_stack_info"]
    extra = 0
    can_delete = False
    show_change_link = True

    @admin.display(description=_("SQL"), ordering="sql")
    def _sql(self, obj: SQLLog) -> SafeString:
        title = "Show query"
        val = f"""
        <details>
          <summary style="cursor: pointer">{title}</summary>
          <pre>{obj.sql_formatted}</pre>
        </details>
        """
        return mark_safe(val)  # noqa: S308  # nosec  # NOSONAR

    @admin.display(description=_("Stack Info"), ordering="stack_info")
    def _stack_info(self, obj: SQLLog) -> SafeString:
        return mark_safe(f"<pre>{obj.stack_info}</pre>")  # noqa: S308  # nosec  # NOSONAR

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
        "_num_of_sql_logs",
        "_duration_sql",
        "_duration_ms",
        "created",
    ]
    readonly_fields = [
        "request_id",
        "path",
        "_body",
        "_num_of_sql_logs",
        "_duration_sql",
        "_duration_ms",
        "created",
    ]
    list_filter = [
        "path",
        ("created", DateTimeRangeFilterBuilder(title=_("Created"))),
        ("duration_ms", NumericRangeFilterBuilder(title=_("Duration (ms)"))),
    ]
    search_fields = [
        "request_id",
        "path",
        "body",
    ]
    search_help_text = _("Search by request ID, path or body")
    actions = [
        "export_results_to_csv",
    ]
    ordering = [
        "-created",
    ]

    @admin.display(description=_("Queries"), ordering="queries")
    def _num_of_sql_logs(self, obj: RequestLog) -> int:
        return getattr(obj, "queries", -1)

    @admin.display(description=_("Duration Total (ms)"), ordering="duration_ms")
    def _duration_ms(self, obj: RequestLog) -> str:
        return obj.duration_str

    @admin.display(description=_("Duration SQL (ms)"), ordering="duration_sql")
    def _duration_sql(self, obj: RequestLog) -> str:
        value = getattr(obj, "duration_sql", -1) / 1_000_000
        return f"~{value:_.2f}".replace("_", " ")

    @admin.display(description=_("Body"), ordering="body")
    def _body(self, obj: RequestLog) -> SafeString:
        match = re.search(r"query (?P<title>\w+)\(", obj.body)
        title = "Show query"
        if match is not None:
            title += f" for '{match.group('title')}'"

        val = f"""
        <details>
          <summary style="cursor: pointer">{title}</summary>
          <pre>{obj.body}</pre>
        </details>
        """
        return mark_safe(val)  # noqa: S308  # nosec  # NOSONAR

    def get_queryset(self, request: WSGIRequest) -> RequestLogQuerySet:
        return (
            super()
            .get_queryset(request)
            .prefetch_related("sql_logs")
            .annotate(
                queries=models.Count("sql_logs"),
                duration_sql=Coalesce(models.Sum("sql_logs__duration_ns"), 0),
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
