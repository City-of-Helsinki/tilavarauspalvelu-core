from django.contrib import admin

from reservation_units.models import ReservationUnitImage

__all__ = [
    "ReservationUnitImageAdmin",
]


@admin.register(ReservationUnitImage)
class ReservationUnitImageAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "reservation_unit",
        "image_type",
    ]
