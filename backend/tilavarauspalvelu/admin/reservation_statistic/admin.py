from __future__ import annotations

from django.contrib import admin
from import_export.admin import ExportMixin
from import_export.formats.base_formats import CSV
from rangefilter.filters import DateRangeFilter

from tilavarauspalvelu.admin.helpers import ImmutableModelAdmin
from tilavarauspalvelu.models import ReservationStatistic


@admin.register(ReservationStatistic)
class ReservationStatisticAdmin(ExportMixin, ImmutableModelAdmin):
    # Functions
    formats = [CSV]

    # List
    list_filter = (
        ("reservation_created_at", DateRangeFilter),
        ("begin", DateRangeFilter),
    )
