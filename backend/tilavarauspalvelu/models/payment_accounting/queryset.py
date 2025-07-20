from __future__ import annotations

from tilavarauspalvelu.models import PaymentAccounting
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PaymentAccountingManager",
    "PaymentAccountingQuerySet",
]


class PaymentAccountingQuerySet(ModelQuerySet[PaymentAccounting]): ...


class PaymentAccountingManager(ModelManager[PaymentAccounting, PaymentAccountingQuerySet]): ...
