from django import forms
from django.contrib import admin

from merchants.models import PaymentAccounting

__all__ = [
    "PaymentAccountingAdmin",
]


class PaymentAccountingForm(forms.ModelForm):
    class Meta:
        model = PaymentAccounting
        fields = [
            "name",
            "company_code",
            "main_ledger_account",
            "vat_code",
            "internal_order",
            "profit_center",
            "project",
            "operation_area",
            "balance_profit_center",
        ]
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
        }


@admin.register(PaymentAccounting)
class PaymentAccountingAdmin(admin.ModelAdmin):
    # Form
    form = PaymentAccountingForm
