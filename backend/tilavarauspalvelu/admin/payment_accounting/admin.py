from __future__ import annotations

from django import forms
from django.contrib import admin

from tilavarauspalvelu.admin.log_entry.mixins import TVPAuditlogHistoryAdminMixin
from tilavarauspalvelu.models import PaymentAccounting

__all__ = [
    "PaymentAccountingAdmin",
]


class PaymentAccountingForm(forms.ModelForm):
    class Meta:
        model = PaymentAccounting
        fields = []  # Use fields from ModelAdmin
        # Labels are intentionally left untranslated (TILA-3425)
        labels = {
            "name": "Accounting name",
            "company_code": "Company code",
            "main_ledger_account": "Main ledger account",
            "vat_code": "VAT code",
            "internal_order": "Internal order",
            "profit_center": "Profit center",
            "project": "Project",
            "operation_area": "Operation area",
            "balance_profit_center": "Balance profit center",
            "product_invoicing_sales_org": "Sales organisation",
            "product_invoicing_sales_office": "Sales office",
            "product_invoicing_material": "Material",
            "product_invoicing_order_type": "Order type",
        }
        help_texts = {
            "name": "Name for this accounting in Varaamo. It is not sent to SAP.",
            "company_code": "SAP company code of the city division.",
            "main_ledger_account": (
                "Revenue account where the income is booked. Varaamo usually uses 340025 (Tilojen muut vuokratuotot)."
            ),
            "vat_code": (
                "SAP VAT code. It must match the VAT percentage of the prices that use this accounting. "
                "Ask the Talpa team for the correct code."
            ),
            "internal_order": (
                "Accounting identifier that assigns the income to the correct profit center. "
                "Each service has its own internal order. "
                "10 digits that start with the division code, for example 29. "
                "Fill this, profit center or project. Cannot be used together with profit center."
            ),
            "profit_center": (
                "Profit center (tulosyksikkö) that the income is assigned to. "
                "Internal accounting field. The division's financial administration decides how it is used. "
                "Fill this, internal order or project. Cannot be used together with internal order."
            ),
            "project": (
                "SAP project number. A project is either real or statistical. "
                "A real project is used without an internal order. A statistical project needs an internal order. "
                "Varaamo rarely uses projects. "
                "Fill this, internal order or profit center. 7, 10, 12, 14 or 16 digits."
            ),
            "operation_area": (
                "Type of activity that the income comes from within the unit. "
                "Different activities in the same unit can have different operation areas. "
                "Internal accounting field. The division's financial administration decides how it is used."
            ),
            "balance_profit_center": (
                "Top-level identifier for income that comes through the Talpa web shop. "
                "It must be the same for all accountings used with merchants of the same Paytrail main merchant."
            ),
            "product_invoicing_sales_org": "SAP sales organisation of the city division.",
            "product_invoicing_sales_office": "Sales office of the service.",
            "product_invoicing_material": (
                "Identifies the product or service that is invoiced. It is bound to a VAT category. "
                "It does not usually change when the VAT percentage changes."
            ),
            "product_invoicing_order_type": "Type of invoice in the Talpa web shop. ZTY1 is a normal sales invoice.",
        }


@admin.register(PaymentAccounting)
class PaymentAccountingAdmin(TVPAuditlogHistoryAdminMixin, admin.ModelAdmin):
    # Form
    form = PaymentAccountingForm
    fieldsets = [
        [
            None,
            {
                "fields": [
                    "name",
                    "company_code",
                    "main_ledger_account",
                    "vat_code",
                    "internal_order",
                    "profit_center",
                    "project",
                    "operation_area",
                    "balance_profit_center",
                ],
            },
        ],
        [
            "Product invoicing",
            {
                "description": "Used when the reservation is paid by invoice. Fill all fields or none.",
                "fields": [
                    "product_invoicing_sales_org",
                    "product_invoicing_sales_office",
                    "product_invoicing_material",
                    "product_invoicing_order_type",
                ],
            },
        ],
    ]
