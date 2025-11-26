from __future__ import annotations

from auditlog.admin import LogEntryAdmin as OriginalLogEntryAdmin
from auditlog.filters import CIDFilter, ResourceTypeFilter
from auditlog.models import LogEntry
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

admin.site.unregister(LogEntry)


@admin.register(LogEntry)
class LogEntryAdmin(OriginalLogEntryAdmin):
    date_hierarchy = "timestamp"
    list_select_related = ["content_type", "actor"]
    list_display = [
        "created",
        "resource_url",
        "action",
        "msg_short",
        "user_url",
        "cid_url",
    ]
    search_fields = [
        "timestamp",
        "object_repr",
        "changes",
        "actor__first_name",
        "actor__last_name",
        "actor__username",
    ]
    list_filter = [
        "action",
        ResourceTypeFilter,
        CIDFilter,
    ]
    readonly_fields = [
        "created",
        "resource_url",
        "action",
        "user_url",
        "msg",
    ]
    fieldsets = [
        (None, {"fields": ["created", "user_url", "resource_url", "cid"]}),
        (_("Changes"), {"fields": ["action", "msg"]}),
    ]
