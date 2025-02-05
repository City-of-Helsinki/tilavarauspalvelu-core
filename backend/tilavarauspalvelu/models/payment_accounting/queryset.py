from __future__ import annotations

from django.db import models

__all__ = [
    "PaymentAccountingManager",
    "PaymentAccountingQuerySet",
]


class PaymentAccountingQuerySet(models.QuerySet): ...


class PaymentAccountingManager(models.Manager.from_queryset(PaymentAccountingQuerySet)): ...
