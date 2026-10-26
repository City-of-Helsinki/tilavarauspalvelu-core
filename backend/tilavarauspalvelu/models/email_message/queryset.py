from __future__ import annotations

from typing import Self, TypeVar

from tilavarauspalvelu.models import EmailMessage
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_datetime

__all__ = [
    "EmailMessageManager",
    "EmailMessageQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=EmailMessage, covariant=True, default=EmailMessage)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=EmailMessage)


class EmailMessageQuerySet(ModelQuerySet[_TModel_co, _TRow_co]):
    def expired(self) -> Self:
        return self.filter(valid_until__lt=local_datetime())


class EmailMessageManager(ModelManager[EmailMessage, EmailMessageQuerySet]): ...
