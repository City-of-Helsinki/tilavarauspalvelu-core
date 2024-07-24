from django.contrib import admin

from reservation_units.models import TaxPercentage

__all__ = [
    "TaxPercentageAdmin",
]


@admin.register(TaxPercentage)
class TaxPercentageAdmin(admin.ModelAdmin):
    pass
