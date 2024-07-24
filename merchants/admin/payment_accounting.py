from django.contrib import admin

from merchants.models import PaymentAccounting

__all__ = [
    "PaymentAccountingAdmin",
]


@admin.register(PaymentAccounting)
class PaymentAccountingAdmin(admin.ModelAdmin):
    pass
