from adminsortable2.admin import SortableAdminMixin
from django.contrib import admin
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.models import ReservationDenyReason


@admin.register(ReservationDenyReason)
class ReservationDenyReasonAdmin(SortableAdminMixin, TranslationAdmin):
    # List
    list_display = [
        "rank",
        "reason",
    ]
    ordering = ["rank"]
