from django.contrib import admin

from .models import (
    Day,
    DayPart,
    Equipment,
    EquipmentCategory,
    Period,
    Purpose,
    ReservationUnit,
    ReservationUnitImage,
    ReservationUnitType,
)


class ReservationUnitImageInline(admin.TabularInline):
    model = ReservationUnitImage


@admin.register(ReservationUnit)
class ReservationUnitAdmin(admin.ModelAdmin):
    model = ReservationUnit
    inlines = [ReservationUnitImageInline]


@admin.register(ReservationUnitImage)
class ReservationUnitImageAdmin(admin.ModelAdmin):
    model = ReservationUnitImage


@admin.register(ReservationUnitType)
class ReservationUnitTypeAdmin(admin.ModelAdmin):
    model = ReservationUnitType


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


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    model = Equipment


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    model = EquipmentCategory
