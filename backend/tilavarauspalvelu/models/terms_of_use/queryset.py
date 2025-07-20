from __future__ import annotations

from tilavarauspalvelu.models import TermsOfUse
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "TermsOfUseManager",
    "TermsOfUseQuerySet",
]


class TermsOfUseQuerySet(ModelQuerySet[TermsOfUse]): ...


class TermsOfUseManager(ModelManager[TermsOfUse, TermsOfUseQuerySet]): ...
