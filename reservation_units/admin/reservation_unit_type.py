from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import ReservationUnitType

__all__ = [
    "ReservationUnitTypeAdmin",
]


@admin.register(ReservationUnitType)
class ReservationUnitTypeAdmin(SortableAdminMixin, TranslationAdmin):
    pass
