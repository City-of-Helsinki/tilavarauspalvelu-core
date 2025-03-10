from __future__ import annotations

import datetime
from typing import Self

from django.conf import settings
from django.db import models

from tilavarauspalvelu.enums import OrderStatus
from utils.date_utils import local_datetime

__all__ = [
    "PaymentOrderManager",
    "PaymentOrderQuerySet",
]


class PaymentOrderQuerySet(models.QuerySet):
    def expired(self) -> Self:
        older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
        expired_datetime = local_datetime() - datetime.timedelta(minutes=older_than_minutes)

        return self.filter(
            status=OrderStatus.DRAFT,
            created_at__lte=expired_datetime,
            remote_id__isnull=False,
        )


class PaymentOrderManager(models.Manager.from_queryset(PaymentOrderQuerySet)): ...
