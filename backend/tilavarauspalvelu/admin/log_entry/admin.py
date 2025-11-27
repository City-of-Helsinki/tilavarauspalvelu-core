from __future__ import annotations

from typing import TYPE_CHECKING

from auditlog.admin import LogEntryAdmin as OriginalLogEntryAdmin
from auditlog.filters import ResourceTypeFilter
from auditlog.models import LogEntry
from dateutil.relativedelta import relativedelta
from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.db.models import CharField, Value
from django.db.models.functions import Concat, Trim
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateRangeFilterBuilder

from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import WSGIRequest

admin.site.unregister(LogEntry)


class ActorFilter(SimpleListFilter):
    title = _("Actor")
    parameter_name = "actor"

    def lookups(self, request: WSGIRequest, model_admin: LogEntryAdmin) -> list[tuple[int, str]]:
        qs = model_admin.get_queryset(request)
        types = qs.annotate(
            actor_full_name=Trim(
                Concat(
                    "actor__first_name",
                    Value(" "),
                    "actor__last_name",
                    Value(" ("),
                    "actor__email",
                    Value(")"),
                    output_field=CharField(),
                )
            )
        ).values_list("actor__id", "actor_full_name")
        return list(types.order_by("actor__id").distinct())

    def queryset(self, request: WSGIRequest, queryset: models.QuerySet[LogEntry]) -> models.QuerySet[LogEntry]:
        if self.value() is None:
            return queryset
        return queryset.filter(actor=self.value())


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
        ActorFilter,
        ResourceTypeFilter,
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
