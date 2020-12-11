from django.contrib import admin

from .models import Day, DayPart, Period, Purpose, ReservationUnit, ReservationUnitImage


@admin.register(ReservationUnit)
class ReservationUnitAdmin(admin.ModelAdmin):
    model = ReservationUnit


@admin.register(ReservationUnitImage)
class ReservationUnitImageAdmin(admin.ModelAdmin):
    model = ReservationUnitImage


@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    model = Period


@admin.register(Day)
class DayAdmin(admin.ModelAdmin):
    model = Day


@admin.register(DayPart)
class DayPartAdmin(admin.ModelAdmin):
    model = DayPart


@admin.register(Purpose)
class PurposeAdmin(admin.ModelAdmin):
    model = Purpose
    fields = ["name"]
