from django.contrib import admin

from reservation_units.models import DayPart


@admin.register(DayPart)
class DayPartAdmin(admin.ModelAdmin):
    model = DayPart
