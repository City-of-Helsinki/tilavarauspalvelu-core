from __future__ import annotations

from tilavarauspalvelu.models import PriceOption
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "PriceOptionManager",
    "PriceOptionQuerySet",
]


class PriceOptionQuerySet(TranslatedModelQuerySet[PriceOption]): ...


class PriceOptionManager(ModelManager[PriceOption, PriceOptionQuerySet]): ...
