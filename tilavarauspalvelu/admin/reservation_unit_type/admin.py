from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import ReservationUnitType


@admin.register(ReservationUnitType)
class ReservationUnitTypeAdmin(SortableAdminMixin, TranslationAdmin):
    pass
