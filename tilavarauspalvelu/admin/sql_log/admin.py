import uuid

from django import forms
from django.contrib import admin
from django.utils.safestring import SafeString, mark_safe
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateTimeRangeFilter

from tilavarauspalvelu.models.sql_log.model import SQLLog
from tilavarauspalvelu.models.sql_log.queryset import SQLLogQuerySet
from tilavarauspalvelu.typing import WSGIRequest


class SQLLogAdminInlineForm(forms.ModelForm):
    class Meta:
        model = SQLLog
        fields = []  # Use fields from ModelAdmin
        labels = {
            "sql": _("SQL"),
            "duration_ns": _("Duration (ns)"),
            "succeeded": _("Succeeded"),
        }
        help_texts = {
            "sql": _("SQL that was executed (without params)."),
            "duration_ns": _("Duration of the SQL query in nanoseconds."),
            "succeeded": _("Whether the SQL query succeeded or not."),
        }


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


class SQLLogAdminForm(forms.ModelForm):
    class Meta:
        model = SQLLog
        fields = []  # Use fields from ModelAdmin
        labels = {
            "request_log": _("Request log"),
            "sql": _("SQL"),
            "duration_ns": _("Duration (ns)"),
            "succeeded": _("Succeeded"),
            "stack_info": _("Stack Info"),
        }
        help_texts = {
            "request_log": _("Request log"),
            "sql": _("SQL that was executed (without params)."),
            "duration_ns": _("Duration of the SQL query in nanoseconds."),
            "succeeded": _("Whether the SQL query succeeded or not."),
            "stack_info": _("Stack trace where the SQL query was executed."),
        }


@admin.register(SQLLog)
class SQLLogAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "sql",
        "request_log__path",
        "request_log__body",
        "request_log__request_id",
    ]
    search_help_text = _("Search by SQL, request log path, body or request ID")

    # List
    list_display = [
        "id",
        "_request_id",
        "_path",
        "_duration_ms",
        "_sql_display",
    ]
    list_filter = [
        "request_log__path",
        "succeeded",
        ("request_log__created", DateTimeRangeFilter),
    ]
    ordering = ["-id"]

    # Form
    form = SQLLogAdminForm
    readonly_fields = [
        "_sql",
        "request_log",
        "_duration_ms",
        "succeeded",
        "_stack_info",
    ]

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
