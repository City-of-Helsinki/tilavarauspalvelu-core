from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin

from reservation_units.models import Purpose


@admin.register(Purpose)
class PurposeAdmin(SortableAdminMixin, admin.ModelAdmin):
    model = Purpose
