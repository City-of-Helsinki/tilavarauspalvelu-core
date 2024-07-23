from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import ReservationUnitType


@admin.register(ReservationUnitType)
class ReservationUnitTypeAdmin(SortableAdminMixin, TranslationAdmin):
    pass
