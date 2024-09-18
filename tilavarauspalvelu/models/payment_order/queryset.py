from __future__ import annotations

from django.db import models

__all__ = [
    "PaymentOrderManager",
    "PaymentOrderQuerySet",
]


class PaymentOrderQuerySet(models.QuerySet): ...


class PaymentOrderManager(models.Manager.from_queryset(PaymentOrderQuerySet)): ...
