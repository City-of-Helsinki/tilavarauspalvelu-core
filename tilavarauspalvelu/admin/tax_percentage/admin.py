from django.contrib import admin

from tilavarauspalvelu.models import TaxPercentage


@admin.register(TaxPercentage)
class TaxPercentageAdmin(admin.ModelAdmin):
    pass
