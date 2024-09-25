from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import ReservationUnitCancellationRule


@admin.register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleAdmin(TranslationAdmin):
    # List
    list_display = [
        "name",
        "can_be_cancelled_time_before",
        "needs_handling",
    ]
