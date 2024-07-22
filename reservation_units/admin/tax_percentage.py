from django.contrib import admin

from reservation_units.models import TaxPercentage


@admin.register(TaxPercentage)
class TaxPercentageAdmin(admin.ModelAdmin):
    pass
