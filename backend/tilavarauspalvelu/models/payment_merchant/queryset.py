from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PaymentMerchant
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PaymentMerchantManager",
    "PaymentMerchantQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PaymentMerchant, covariant=True, default=PaymentMerchant)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PaymentMerchant)


class PaymentMerchantQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class PaymentMerchantManager(ModelManager[PaymentMerchant, PaymentMerchantQuerySet]): ...
