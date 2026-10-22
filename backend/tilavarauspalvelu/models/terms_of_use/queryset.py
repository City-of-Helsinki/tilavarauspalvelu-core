from __future__ import annotations

from tilavarauspalvelu.models import TermsOfUse
from tilavarauspalvelu.models._base import ModelQuerySet, TranslatedModelManager

__all__ = [
    "TermsOfUseManager",
    "TermsOfUseQuerySet",
]


class TermsOfUseQuerySet(ModelQuerySet[TermsOfUse]): ...


class TermsOfUseManager(TranslatedModelManager[TermsOfUse, TermsOfUseQuerySet]): ...
