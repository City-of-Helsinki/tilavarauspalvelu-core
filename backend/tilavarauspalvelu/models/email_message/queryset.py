from __future__ import annotations

from typing import Self

from tilavarauspalvelu.models import EmailMessage
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_datetime

__all__ = [
    "EmailMessageManager",
    "EmailMessageQuerySet",
]


class EmailMessageQuerySet(ModelQuerySet[EmailMessage]):
    def expired(self) -> Self:
        return self.filter(valid_until__lt=local_datetime())


class EmailMessageManager(ModelManager[EmailMessage, EmailMessageQuerySet]): ...
