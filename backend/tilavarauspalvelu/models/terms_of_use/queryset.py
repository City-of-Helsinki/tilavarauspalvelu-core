from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import TermsOfUse
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "TermsOfUseManager",
    "TermsOfUseQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=TermsOfUse, covariant=True, default=TermsOfUse)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=TermsOfUse)


class TermsOfUseQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class TermsOfUseManager(ModelManager[TermsOfUse, TermsOfUseQuerySet]): ...
