from __future__ import annotations

from django.db import models

__all__ = [
    "PaymentMerchantManager",
    "PaymentMerchantQuerySet",
]


class PaymentMerchantQuerySet(models.QuerySet): ...


class PaymentMerchantManager(models.Manager.from_queryset(PaymentMerchantQuerySet)): ...
