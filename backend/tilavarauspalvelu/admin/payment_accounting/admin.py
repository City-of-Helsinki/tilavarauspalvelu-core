from __future__ import annotations

from django import forms
from django.contrib import admin

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


@admin.register(PaymentAccounting)
class PaymentAccountingAdmin(admin.ModelAdmin):
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
                "fields": [
                    "product_invoicing_sales_org",
                    "product_invoicing_sales_office",
                    "product_invoicing_material",
                    "product_invoicing_order_type",
                ],
            },
        ],
    ]
