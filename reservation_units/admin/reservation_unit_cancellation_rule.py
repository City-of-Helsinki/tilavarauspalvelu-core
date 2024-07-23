from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import ReservationUnitCancellationRule


@admin.register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleAdmin(TranslationAdmin):
    pass
