from django.contrib import admin
from django.forms import CharField, ModelForm
from tinymce.widgets import TinyMCE

from .models import (
    Day,
    DayPart,
    Equipment,
    EquipmentCategory,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    Period,
    Purpose,
    ReservationUnit,
    ReservationUnitImage,
    ReservationUnitType,
)


class ReservationUnitAdminForm(ModelForm):
    description = CharField(widget=TinyMCE())
    terms_of_use = CharField(widget=TinyMCE())

    class Meta:
        model = ReservationUnit
        fields = "__all__"


class ReservationUnitImageInline(admin.TabularInline):
    model = ReservationUnitImage


@admin.register(ReservationUnit)
class ReservationUnitAdmin(admin.ModelAdmin):
    model = ReservationUnit
    form = ReservationUnitAdminForm
    inlines = [ReservationUnitImageInline]
    readonly_fields = ["uuid"]


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


@admin.register(KeywordCategory)
class KeywordCategoryAdmin(admin.ModelAdmin):
    model = KeywordCategory


@admin.register(KeywordGroup)
class KeywordGroupAdmin(admin.ModelAdmin):
    model = KeywordGroup


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    model = Keyword
