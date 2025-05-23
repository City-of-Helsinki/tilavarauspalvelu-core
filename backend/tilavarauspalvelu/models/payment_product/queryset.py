from __future__ import annotations

from django.db import models

__all__ = [
    "PaymentProductManager",
    "PaymentProductQuerySet",
]


class PaymentProductQuerySet(models.QuerySet): ...


class PaymentProductManager(models.Manager.from_queryset(PaymentProductQuerySet)): ...
