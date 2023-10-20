from django.contrib import admin

from reservation_units.models import ReservationUnitPricing


@admin.register(ReservationUnitPricing)
class ReservationUnitPricingAdmin(admin.ModelAdmin):
    model = ReservationUnitPricing
