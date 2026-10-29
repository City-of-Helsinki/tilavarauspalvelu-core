from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PaymentAccounting
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PaymentAccountingManager",
    "PaymentAccountingQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PaymentAccounting, covariant=True, default=PaymentAccounting)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PaymentAccounting)


class PaymentAccountingQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class PaymentAccountingManager(ModelManager[PaymentAccounting, PaymentAccountingQuerySet]): ...
