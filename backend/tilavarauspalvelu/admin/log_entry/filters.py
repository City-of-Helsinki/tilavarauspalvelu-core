from __future__ import annotations

from typing import TYPE_CHECKING

from auditlog.models import LogEntry
from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from django.db.models import Exists, OuterRef
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class LogEntryResourceTypeFilter(admin.SimpleListFilter):
    title = _("Resource Type")
    parameter_name = "resource_type"

    def lookups(
        self,
        request: WSGIRequest,
        model_admin: admin.ModelAdmin,  # noqa: ARG002
    ) -> list[tuple[int, str]]:
        # Check the few content types against the 'content_type_id' index.
        # Selecting distinct content types from the log entries scans the whole log entry table.
        log_entries = LogEntry.objects.filter(content_type=OuterRef("pk"))
        content_types = ContentType.objects.filter(Exists(log_entries)).order_by("model")
        return list(content_types.values_list("pk", "model"))

    def queryset(self, request: WSGIRequest, queryset: QuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(content_type_id=value)
