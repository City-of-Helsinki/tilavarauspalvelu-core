from __future__ import annotations

from typing import TYPE_CHECKING

from auditlog.admin import LogEntryAdmin as OriginalLogEntryAdmin
from auditlog.filters import CIDFilter, ResourceTypeFilter
from auditlog.models import LogEntry
from dateutil.relativedelta import relativedelta
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateRangeFilterBuilder

from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from django.db import models

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
        (
            "timestamp",
            DateRangeFilterBuilder(
                title=_("Created at"),
                default_start=local_datetime() - relativedelta(years=2),  # Default value in field (not applied on load)
            ),
        ),
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

    def get_queryset(self, request) -> models.QuerySet[LogEntry]:
        self.request = request
        cutoff_date = local_datetime() - relativedelta(years=2)  # Don't show records older than 2 years
        return super().get_queryset(request=request).filter(timestamp__gte=cutoff_date)
