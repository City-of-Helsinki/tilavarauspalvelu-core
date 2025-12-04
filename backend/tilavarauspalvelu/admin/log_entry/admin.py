from __future__ import annotations

from typing import TYPE_CHECKING, Any

from auditlog.admin import LogEntryAdmin as OriginalLogEntryAdmin
from auditlog.filters import ResourceTypeFilter
from auditlog.models import LogEntry
from dateutil.relativedelta import relativedelta
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from more_admin_filters import MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter
from rangefilter.filters import DateRangeFilterBuilder

from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from django.db import models


admin.site.unregister(LogEntry)


class ActorFilter(MultiSelectRelatedDropdownFilter, MultiSelectRelatedOnlyFilter):
    def field_admin_ordering(self, *args: Any, **kwargs: Any) -> list[str]:
        return ["last_name", "first_name", "email"]


@admin.register(LogEntry)
class LogEntryAdmin(OriginalLogEntryAdmin):
    date_hierarchy = "timestamp"
    list_select_related = ["content_type", "actor"]
    list_display = [
        "created",
        "resource_url",
        "object_id",
        "action",
        "msg_short",
        "user_url",
    ]
    search_fields = [
        "timestamp",
        "object_repr",
        "object_id",
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
        ("actor", ActorFilter),
    ]
    readonly_fields = [
        "created",
        "resource_url",
        "action",
        "user_url",
        "msg",
    ]
    fieldsets = [
        (None, {"fields": ["created", "user_url", "resource_url"]}),
        (_("Changes"), {"fields": ["action", "msg"]}),
    ]

    @admin.display(description=_("Created"), ordering="timestamp")  # Override to add ordering
    def created(self, obj) -> str:
        return super().created(obj)

    @admin.display(description=_("User"), ordering="actor__id")  # Override to add ordering
    def user_url(self, obj) -> str:
        return super().user_url(obj)

    @admin.display(description=_("Resource"), ordering="content_type__model")  # Override to add ordering
    def resource_url(self, obj) -> str:
        return super().resource_url(obj)

    def get_queryset(self, request) -> models.QuerySet[LogEntry]:
        self.request = request
        cutoff_date = local_datetime() - relativedelta(years=2)  # Don't show records older than 2 years
        return super().get_queryset(request=request).filter(timestamp__gte=cutoff_date)
