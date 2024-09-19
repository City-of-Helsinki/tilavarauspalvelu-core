from __future__ import annotations

import datetime
from decimal import Decimal
from functools import cached_property
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from common.date_utils import local_datetime
from reservations.enums import ReservationStateChoice
from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType
from tilavarauspalvelu.utils.email.reservation_email_notification_sender import ReservationEmailNotificationSender
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.utils.verkkokauppa.payment.types import Payment
from tilavarauspalvelu.utils.verkkokauppa.payment.types import PaymentStatus as WebShopPaymentStatus
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.sentry import SentryLogger

from .queryset import PaymentOrderManager

if TYPE_CHECKING:
    import uuid

    from reservations.models import Reservation
    from tilavarauspalvelu.utils.verkkokauppa.order.types import Order

    from .actions import PaymentOrderActions


__all__ = [
    "PaymentOrder",
]


class PaymentOrder(models.Model):
    reservation: Reservation | None = models.ForeignKey(
        "reservations.Reservation",
        related_name="payment_order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    remote_id: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    payment_id: str = models.CharField(blank=True, default="", max_length=128)
    refund_id: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    payment_type: str = models.CharField(max_length=128, choices=PaymentType.choices)
    status: str = models.CharField(max_length=128, choices=OrderStatus.choices, db_index=True)

    price_net: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    price_vat: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    price_total: Decimal = models.DecimalField(max_digits=10, decimal_places=2)

    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)
    processed_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    language: str = models.CharField(max_length=8, choices=Language.choices)
    reservation_user_uuid: uuid.UUID | None = models.UUIDField(blank=True, null=True)
    checkout_url: str = models.CharField(blank=True, default="", max_length=512)
    receipt_url: str = models.CharField(blank=True, default="", max_length=512)

    objects = PaymentOrderManager()

    class Meta:
        db_table = "payment_order"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"PaymentOrder {self.pk}"

    def save(self, *args: Any, **kwargs: Any) -> PaymentOrder:
        self.full_clean()
        return super().save(*args, **kwargs)

    @cached_property
    def actions(self) -> PaymentOrderActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PaymentOrderActions

        return PaymentOrderActions(self)

    def clean(self) -> None:
        validation_errors = {}

        failsafe_price_net = self.price_net or Decimal("0.0")
        failsafe_price_vat = self.price_vat or Decimal("0.0")

        if self.price_net is not None and self.price_net < Decimal("0.01"):
            validation_errors.setdefault("price_net", []).append(_("Must be greater than 0.01"))
        if self.price_vat is not None and self.price_vat < Decimal("0"):
            validation_errors.setdefault("price_vat", []).append(_("Must be greater than 0"))
        if self.price_total is not None and self.price_total != failsafe_price_net + failsafe_price_vat:
            validation_errors.setdefault("price_total", []).append(_("Must be the sum of net and vat amounts"))

        if validation_errors:
            raise ValidationError(validation_errors)

    @property
    def expires_at(self) -> datetime.datetime | None:
        if self.status != OrderStatus.DRAFT:
            return None

        return self.created_at + datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)

    def get_order_payment_from_webshop(self) -> Payment | None:
        try:
            return VerkkokauppaAPIClient.get_payment(order_uuid=self.remote_id)
        except GetPaymentError as err:
            SentryLogger.log_exception(err, details="Fetching order payment failed.", remote_id=self.remote_id)
            raise

    def cancel_order_in_webshop(self) -> Order | None:
        try:
            return VerkkokauppaAPIClient.cancel_order(order_uuid=self.remote_id, user_uuid=self.reservation_user_uuid)
        except CancelOrderError as err:
            SentryLogger.log_exception(err, details="Canceling order failed.", remote_id=self.remote_id)
            raise

    def get_order_status_from_webshop_response(self, webshop_payment: Payment | None) -> OrderStatus:
        """Determines the order status based on the payment response from the webshop."""
        # Statuses PAID, PAID_MANUALLY and REFUNDED are "final" and should not be updated from the webshop.
        if self.status in (OrderStatus.REFUNDED, OrderStatus.PAID, OrderStatus.PAID_MANUALLY):
            return OrderStatus(self.status)

        older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
        webshop_payment_expires_at = local_datetime() - datetime.timedelta(minutes=older_than_minutes)

        if webshop_payment:
            if webshop_payment.status == WebShopPaymentStatus.CANCELLED.value:
                return OrderStatus.CANCELLED
            if webshop_payment.status == WebShopPaymentStatus.PAID_ONLINE.value:
                return OrderStatus.PAID
            if (
                webshop_payment.status == WebShopPaymentStatus.CREATED.value
                and webshop_payment.timestamp
                and webshop_payment.timestamp > webshop_payment_expires_at
            ):
                # User has entered payment phase in webshop (Payment is created but not yet paid),
                # give more time to complete the payment before marking the order as expired.
                return OrderStatus.DRAFT
        elif not webshop_payment and self.expires_at > local_datetime():
            # User has not entered payment phase in webshop within the expiration time
            return OrderStatus.DRAFT

        return OrderStatus.EXPIRED

    def update_order_status(self, new_status: OrderStatus, payment_id: str = "") -> None:
        """
        Updates the PaymentOrder status and processed_at timestamp if the status has changed.

        If the order is paid, updates the reservation state to confirmed and sends a confirmation email.
        """
        if new_status == self.status:
            return

        self.status = new_status
        self.processed_at = local_datetime()
        if payment_id:
            self.payment_id = payment_id
        self.save(update_fields=["status", "processed_at", "payment_id"])

        # If the order is paid, update the reservation state to confirmed and send confirmation email
        if (
            self.status == OrderStatus.PAID
            and self.reservation is not None
            and self.reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT
        ):
            self.reservation.state = ReservationStateChoice.CONFIRMED
            self.reservation.save(update_fields=["state"])
            ReservationEmailNotificationSender.send_confirmation_email(reservation=self.reservation)

    def refresh_order_status_from_webshop(self):
        """Fetches the payment status from the webshop and updates the PaymentOrder status accordingly."""
        webshop_payment: Payment | None = self.get_order_payment_from_webshop()
        new_status: OrderStatus = self.get_order_status_from_webshop_response(webshop_payment)
        self.update_order_status(new_status, webshop_payment.payment_id if webshop_payment else "")
