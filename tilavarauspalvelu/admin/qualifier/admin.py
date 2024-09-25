from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import Qualifier


@admin.register(Qualifier)
class QualifierAdmin(TranslationAdmin):
    pass
