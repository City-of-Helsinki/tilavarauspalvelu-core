import uuid

from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext_lazy as _

from common.admin.forms import SQLLogAdminForm
from common.admin.forms.sql_log import RequestLogAdminForm, SQLLogAdminInlineForm
from common.models import RequestLog, SQLLog
from common.querysets.sql_log import RequestLogQuerySet, SQLLogQuerySet


@admin.register(SQLLog)
class SQLLogAdmin(admin.ModelAdmin):
    form = SQLLogAdminForm
    list_display = [
        "_sql",
        "_path",
        "_request_id",
        "duration_ns",
        "succeeded",
    ]
    readonly_fields = [
        "sql",
        "request_log",
        "duration_ns",
        "succeeded",
    ]
    list_filter = [
        "request_log__path",
        "succeeded",
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
    def _sql(self, obj: SQLLog) -> str:
        length = 97
        return obj.sql[:length] + ("..." if len(obj.sql) > length else "")

    @admin.display(description=_("Path"), ordering="request_log__path")
    def _path(self, obj: SQLLog) -> str:
        return obj.request_log.path

    @admin.display(description=_("Request ID"), ordering="request_log__request_id")
    def _request_id(self, obj: SQLLog) -> uuid.UUID:
        return obj.request_log.request_id

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False


class SQLLogAdminInline(admin.TabularInline):
    model = SQLLog
    form = SQLLogAdminInlineForm
    readonly_fields = ["sql", "duration_ns", "succeeded"]
    extra = 0
    can_delete = False

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
        "duration_ms",
        "created",
    ]
    readonly_fields = [
        "request_id",
        "path",
        "body",
        "duration_ms",
        "created",
    ]
    list_filter = [
        "path",
    ]
    search_fields = [
        "request_id",
        "path",
        "body",
    ]

    @admin.display(description=_("Queries"), ordering="queries")
    def num_of_sql_logs(self, obj: RequestLog) -> int:
        return getattr(obj, "queries", -1)

    def get_queryset(self, request: WSGIRequest) -> RequestLogQuerySet:
        return super().get_queryset(request).prefetch_related("sql_logs").annotate(queries=models.Count("sql_logs"))

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False
