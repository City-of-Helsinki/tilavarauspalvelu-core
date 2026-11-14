from typing import TYPE_CHECKING

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from modeltranslation.admin import TabbedTranslationAdmin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.models import PriceOption

from .form import PriceOptionAdminForm

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "PriceOptionAdmin",
]


@admin.register(PriceOption)
class PriceOptionAdmin(TVPAuditlogHistoryAdminMixin, TabbedTranslationAdmin):
    # Functions
    search_fields = ["name"]
    search_help_text = _("Search by name")

    # List
    list_display = [
        "id",
        "name",
        "unit_group",
        "is_active",
    ]
    list_filter = ["unit_group", "is_active"]
    list_select_related = ["unit_group"]
    ordering = ["name"]

    # Form
    form = PriceOptionAdminForm
    fields = [
        "name",
        "description",
        "unit_group",
        "is_active",
    ]

    def get_readonly_fields(self, request: WSGIRequest, obj: PriceOption | None = None) -> list[str]:
        # Price components must use an option of their pricing group's unit group.
        if obj is not None and obj.price_components.exists():
            return ["unit_group"]
        return []
