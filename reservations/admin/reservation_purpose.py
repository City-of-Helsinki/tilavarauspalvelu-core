from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservations.models import ReservationPurpose

__all__ = [
    "ReservationPurposeAdmin",
]


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(TranslationAdmin):
    pass
