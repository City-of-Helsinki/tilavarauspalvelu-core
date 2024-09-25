from django.contrib import admin
from import_export.admin import ExportMixin
from import_export.formats.base_formats import CSV
from rangefilter.filters import DateRangeFilter

from tilavarauspalvelu.models import ReservationStatistic


@admin.register(ReservationStatistic)
class ReservationStatisticAdmin(ExportMixin, admin.ModelAdmin):
    # Functions
    formats = [CSV]

    # List
    list_filter = (
        ("reservation_created_at", DateRangeFilter),
        ("begin", DateRangeFilter),
    )
