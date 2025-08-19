from __future__ import annotations

from typing import Self

from django.db import models

from utils.date_utils import local_datetime

__all__ = [
    "EmailMessageManager",
    "EmailMessageQuerySet",
]


class EmailMessageQuerySet(models.QuerySet):
    def expired(self) -> Self:
        return self.filter(valid_until__lt=local_datetime())


class EmailMessageManager(models.Manager.from_queryset(EmailMessageQuerySet)):
    # For typing.
    def all(self) -> EmailMessageQuerySet:
        return super().all()
