from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PaymentProduct
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PaymentProductManager",
    "PaymentProductQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PaymentProduct, covariant=True, default=PaymentProduct)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PaymentProduct)


class PaymentProductQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class PaymentProductManager(ModelManager[PaymentProduct, PaymentProductQuerySet]): ...
