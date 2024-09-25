from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import ReservationPurpose


@admin.register(ReservationPurpose)
class ReservationPurposeAdmin(TranslationAdmin):
    pass
