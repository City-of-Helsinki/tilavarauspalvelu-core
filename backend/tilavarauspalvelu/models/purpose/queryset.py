from __future__ import annotations

from tilavarauspalvelu.models import Purpose
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PurposeManager",
    "PurposeQuerySet",
]


class PurposeQuerySet(ModelQuerySet[Purpose]): ...


class PurposeManager(ModelManager[Purpose, PurposeQuerySet]): ...
