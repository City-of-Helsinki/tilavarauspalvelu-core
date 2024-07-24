from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservations.models import ReservationCancelReason

__all__ = [
    "ReservationCancelReasonAdmin",
]


@admin.register(ReservationCancelReason)
class ReservationCancelReasonAdmin(TranslationAdmin):
    pass
