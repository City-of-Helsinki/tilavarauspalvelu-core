from django.contrib import admin

from reservation_units.models import Period


@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    model = Period
