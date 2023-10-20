from django.contrib import admin

from reservation_units.models import ReservationUnitImage


@admin.register(ReservationUnitImage)
class ReservationUnitImageAdmin(admin.ModelAdmin):
    model = ReservationUnitImage
