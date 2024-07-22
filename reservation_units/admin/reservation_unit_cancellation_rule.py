from django.contrib import admin

from reservation_units.models import ReservationUnitCancellationRule


@admin.register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleAdmin(admin.ModelAdmin):
    pass
