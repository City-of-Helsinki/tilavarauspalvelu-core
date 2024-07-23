from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from reservation_units.models import Purpose


@admin.register(Purpose)
class PurposeAdmin(SortableAdminMixin, TranslationAdmin):
    pass
