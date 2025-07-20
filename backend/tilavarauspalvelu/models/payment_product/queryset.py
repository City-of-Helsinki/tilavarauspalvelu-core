from __future__ import annotations

from tilavarauspalvelu.models import PaymentProduct
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PaymentProductManager",
    "PaymentProductQuerySet",
]


class PaymentProductQuerySet(ModelQuerySet[PaymentProduct]): ...


class PaymentProductManager(ModelManager[PaymentProduct, PaymentProductQuerySet]): ...
