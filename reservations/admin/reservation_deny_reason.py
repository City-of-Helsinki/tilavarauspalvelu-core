from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservations.models import ReservationDenyReason

__all__ = [
    "ReservationDenyReasonAdmin",
]


@admin.register(ReservationDenyReason)
class ReservationDenyReasonAdmin(SortableAdminMixin, TranslationAdmin):
    pass
