from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Qualifier


@admin.register(Qualifier)
class QualifierAdmin(TranslationAdmin):
    pass
