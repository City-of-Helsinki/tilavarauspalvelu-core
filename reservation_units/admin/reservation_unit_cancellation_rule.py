from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import ReservationUnitCancellationRule


@admin.register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleAdmin(TranslationAdmin):
    list_display = [
        "name",
        "can_be_cancelled_time_before",
        "needs_handling",
    ]
