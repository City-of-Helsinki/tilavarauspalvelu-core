from __future__ import annotations

from tilavarauspalvelu.models import PaymentMerchant
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PaymentMerchantManager",
    "PaymentMerchantQuerySet",
]


class PaymentMerchantQuerySet(ModelQuerySet[PaymentMerchant]): ...


class PaymentMerchantManager(ModelManager[PaymentMerchant, PaymentMerchantQuerySet]): ...
