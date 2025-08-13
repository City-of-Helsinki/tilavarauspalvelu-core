from __future__ import annotations

import datetime
from contextlib import suppress
from typing import Self

from django.conf import settings
from django.db import models, transaction

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from utils.date_utils import local_datetime

__all__ = [
    "PaymentOrderManager",
    "PaymentOrderQuerySet",
]


class PaymentOrderQuerySet(models.QuerySet):
    def expired_direct_payments(self) -> Self:
        now = local_datetime()
        expiration = datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        expires_at = now - expiration

        return self.filter(
            status=OrderStatus.DRAFT,
            created_at__lte=expires_at,
            remote_id__isnull=False,
        )

    def expired_handled_payments(self) -> Self:
        now = local_datetime()
        expiration = datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        expires_at = now - expiration

        return self.filter(
            # Payment is overdue
            models.Q(status=OrderStatus.PENDING)
            & models.Q(handled_payment_due_by__lt=now)
            # Payment never started, or payment expired
            & (models.Q(remote_id__isnull=True) | models.Q(created_at__lte=expires_at))
        )


# Need to do this to get proper type hints in the manager methods, since
# 'from_queryset' returns a subclass of Manager, but is not typed correctly...
_BaseManager: type[models.Manager] = models.Manager.from_queryset(PaymentOrderQuerySet)  # type: ignore[assignment]


class PaymentOrderManager(_BaseManager):
    # Define to get type hints for queryset methods.
    def all(self) -> PaymentOrderQuerySet:
        return super().all()  # type: ignore[return-value]

    def refresh_expired_payments_from_verkkokauppa(self) -> None:
        for payment_order in self.all().expired_direct_payments():
            # Do not update PaymentOrder status if an error occurs
            with suppress(GetPaymentError, CancelOrderError), transaction.atomic():
                payment_order.actions.refresh_order_status_from_webshop()

        for payment_order in self.all().expired_handled_payments():
            # Payment never attempted
            if payment_order.remote_id is None:
                payment_order.status = OrderStatus.EXPIRED
                payment_order.processed_at = local_datetime()
                payment_order.save(update_fields=["status", "processed_at"])
                continue

            # Do not update PaymentOrder status if an error occurs
            with suppress(GetPaymentError, CancelOrderError), transaction.atomic():
                payment_order.actions.refresh_order_status_from_webshop()
