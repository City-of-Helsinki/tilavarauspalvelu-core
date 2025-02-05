from __future__ import annotations

from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import AbilityGroup


@admin.register(AbilityGroup)
class AbilityGroupAdmin(TranslationAdmin):
    pass
