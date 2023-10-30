from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from opening_hours.models import OriginHaukiResource, ReservableTimeSpan
from reservation_units.models import ReservationUnit


class ReservationUnitInline(admin.TabularInline):
    model = ReservationUnit

    fields = ["id", "reservation_unit_link"]
    readonly_fields = ["id", "reservation_unit_link"]
    can_delete = False
    extra = 0

    def has_add_permission(self, request, obj=None):
        return False

    def reservation_unit_link(self, obj):
        url = reverse("admin:reservation_units_reservationunit_change", args=(obj.pk,))

        return format_html(f"<a href={url}>{obj.name_fi}</a>")


class ReservableTimeSpanInline(admin.TabularInline):
    model = ReservableTimeSpan

    fields = ["time_span_str"]
    readonly_fields = ["time_span_str"]
    can_delete = False
    extra = 0

    def has_add_permission(self, request, obj=None):
        return False

    def time_span_str(self, obj):
        return obj._get_datetime_str()


@admin.register(OriginHaukiResource)
class OriginHaukiResourceAdmin(admin.ModelAdmin):
    model = OriginHaukiResource

    list_display = ["id", "opening_hours_hash", "latest_fetched_date"]
    readonly_fields = ["opening_hours_hash", "latest_fetched_date"]

    inlines = [
        ReservationUnitInline,
        ReservableTimeSpanInline,
    ]

    ordering = ["id"]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ["id"] + self.readonly_fields
        return self.readonly_fields
