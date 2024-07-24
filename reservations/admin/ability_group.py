from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservations.models import AbilityGroup

__all__ = [
    "AbilityGroupAdmin",
]


@admin.register(AbilityGroup)
class AbilityGroupAdmin(TranslationAdmin):
    pass
