from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import ReservationCancelReason


@admin.register(ReservationCancelReason)
class ReservationCancelReasonAdmin(TranslationAdmin):
    pass
