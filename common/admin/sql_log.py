from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.utils.translation import gettext_lazy as _

from common.admin.forms import SQLLogAdminForm
from common.models import SQLLog


@admin.register(SQLLog)
class SQLLogAdmin(admin.ModelAdmin):
    form = SQLLogAdminForm
    list_display = [
        "_sql",
        "path",
        "request_id",
        "duration_ns",
        "succeeded",
    ]
    readonly_fields = [
        "sql",
        "path",
        "body",
        "duration_ns",
        "succeeded",
        "created",
    ]
    list_filter = [
        "path",
        "succeeded",
    ]
    search_fields = [
        "sql",
        "path",
        "body",
        "request_id",
    ]

    @admin.display(description=_("SQL"), ordering="sql")
    def _sql(self, obj: SQLLog) -> str:
        return obj.sql[:97] + ("..." if len(obj.sql) > 97 else "")

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: SQLLog | None = None) -> bool:
        return False
