from django.contrib import admin

from reservation_units.models import Day


@admin.register(Day)
class DayAdmin(admin.ModelAdmin):
    model = Day
