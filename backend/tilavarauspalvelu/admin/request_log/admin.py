from __future__ import annotations

import re
from typing import TYPE_CHECKING

from django import forms
from django.contrib import admin, messages
from django.db import models
from django.db.models.functions import Coalesce
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateTimeRangeFilterBuilder, NumericRangeFilterBuilder

from tilavarauspalvelu.admin.helpers import ImmutableModelAdmin
from tilavarauspalvelu.admin.sql_log.admin import SQLLogAdminInline
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models.request_log.model import RequestLog
from tilavarauspalvelu.services.export import SQLLogCSVExporter

if TYPE_CHECKING:
    from django.http import FileResponse
    from django.utils.safestring import SafeString

    from tilavarauspalvelu.models.request_log.queryset import RequestLogQuerySet
    from tilavarauspalvelu.typing import WSGIRequest


class RequestLogAdminForm(forms.ModelForm):
    class Meta:
        model = RequestLog
        fields = []  # Use fields from ModelAdmin
        labels = {
            "request_id": _("Request ID"),
            "path": _("Path"),
            "body": _("Body"),
            "duration_ms": _("Duration (ms)"),
            "created": _("Created"),
        }
        help_texts = {
            "request_id": _("Random ID for grouping this log with other logs from the same request."),
            "path": _("Request path where the SQL was executed."),
            "body": _("Body of the request that executed the SQL."),
            "duration_ms": _("Duration of the request in milliseconds."),
            "created": _("When the SQL query was executed."),
        }


@admin.register(RequestLog)
class RequestLogAdmin(ImmutableModelAdmin):
    # Functions
    actions = ["export_results_to_csv"]
    search_fields = [
        "request_id",
        "path",
        "body",
    ]
    search_help_text = _("Search by request ID, path or body")

    # List
    list_display = [
        "request_id",
        "path",
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
    ordering = ["-created"]

    # Form
    form = RequestLogAdminForm
    inlines = [SQLLogAdminInline]
    readonly_fields = [
        "request_id",
        "path",
        "_body",
        "_num_of_sql_logs",
        "_duration_sql",
        "_duration_ms",
        "created",
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
        if obj.body is None:
            return mark_safe(obj.body)  # noqa: S308  # nosec  # NOSONAR

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

    def get_queryset(self, request: WSGIRequest) -> models.QuerySet:
        return (
            super()
            .get_queryset(request)
            .prefetch_related("sql_logs")
            .annotate(
                queries=models.Count("sql_logs"),
                duration_sql=Coalesce(models.Sum("sql_logs__duration_ns"), 0),
            )
        )

    @admin.action(description=_("Export rows to CSV"))
    def export_results_to_csv(self, request: WSGIRequest, queryset: RequestLogQuerySet) -> FileResponse | None:
        try:
            exporter = SQLLogCSVExporter(queryset=queryset)
            response = exporter.to_file_response()
        except Exception as error:  # noqa: BLE001
            self.message_user(request, f"Error while exporting results: {error}", level=messages.ERROR)
            SentryLogger.log_exception(error, "Error while exporting SQL log results")
            return None

        return response
