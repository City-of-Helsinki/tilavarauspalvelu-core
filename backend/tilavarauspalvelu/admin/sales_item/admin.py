from __future__ import annotations

from django import forms
from django.contrib import admin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.models import SalesItem

__all__ = [
    "SalesItemAdmin",
]


class SalesItemForm(forms.ModelForm):
    class Meta:
        model = SalesItem
        fields = []  # Use fields from ModelAdmin
        # Labels are intentionally left untranslated, like in the payment accounting admin (TILA-3425)
        labels = {
            "name": "Sales item name",
            "material": "Material",
            "main_ledger_account": "Main ledger account",
            "tax_level": "Tax level",
        }
        help_texts = {
            "name": "Name in Varaamo. Staff select the sales item by this name in pricings. It is not sent to SAP.",
            "material": (
                "SAP material (nimike) of the product or service that is sold. "
                "One material has one VAT percentage and one main ledger account. 8 digits. "
                "Only invoicing needs it. Leave it empty if the sales item is only paid in the web shop."
            ),
            "main_ledger_account": (
                "Revenue account where the income is booked. Varaamo usually uses 340025 (Tilojen muut vuokratuotot)."
            ),
            "tax_level": "Tax level of the product. The VAT percentage of the price comes from the rate of this level.",
        }


@admin.register(SalesItem)
class SalesItemAdmin(TVPAuditlogHistoryAdminMixin, admin.ModelAdmin):
    # List
    list_display = [
        "name",
        "tax_level",
        "main_ledger_account",
        "material",
    ]
    list_select_related = ["tax_level"]
    search_fields = ["name", "material"]

    # Form
    form = SalesItemForm
    fields = [
        "name",
        "tax_level",
        "main_ledger_account",
        "material",
    ]
