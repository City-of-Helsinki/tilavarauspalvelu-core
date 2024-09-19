from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from reservation_units.models import ReservationUnit


class ReservationUnitInline(admin.TabularInline):
    model = ReservationUnit
    fields = ["id", "reservation_unit_link"]
    readonly_fields = fields
    can_delete = False
    extra = 0

    def has_add_permission(self, request, obj=None) -> bool:
        return False

    def reservation_unit_link(self, obj):
        url = reverse("admin:reservation_units_reservationunit_change", args=(obj.pk,))

        return format_html(f"<a href={url}>{obj.name_fi}</a>")
