from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin
from lookup_property import L

from tilavarauspalvelu.admin.application_section.form import SuitableTimeRangeInlineAdminForm
from tilavarauspalvelu.models import SuitableTimeRange

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


class SuitableTimeRangeInline(admin.TabularInline):
    model = SuitableTimeRange
    form = SuitableTimeRangeInlineAdminForm
    extra = 0

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).annotate(fulfilled=L("fulfilled"))
