from __future__ import annotations

import datetime
from contextlib import suppress
from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import PaymentStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.verkkokauppa.order.types import Order
    from tilavarauspalvelu.integrations.verkkokauppa.payment.types import Payment

    from .model import PaymentOrder

__all__ = [
    "PaymentOrderActions",
]


class PaymentOrderActions:
    def __init__(self, payment_order: PaymentOrder) -> None:
        self.payment_order = payment_order

    def get_order_payment_from_webshop(self) -> Payment | None:
        try:
            return VerkkokauppaAPIClient.get_payment(order_uuid=self.payment_order.remote_id)
        except GetPaymentError as err:
            SentryLogger.log_exception(
                err,
                details="Fetching order payment failed.",
                remote_id=self.payment_order.remote_id,
            )
            raise

    def set_order_as_cancelled(self) -> None:
        self.payment_order.status = OrderStatus.CANCELLED
        self.payment_order.processed_at = local_datetime()
        self.payment_order.save(update_fields=["status", "processed_at"])

    def cancel_order_in_webshop(self) -> Order | None:
        try:
            return VerkkokauppaAPIClient.cancel_order(
                order_uuid=self.payment_order.remote_id,
                user_uuid=self.payment_order.reservation_user_uuid,
            )
        except CancelOrderError as err:
            SentryLogger.log_exception(
                err,
                details="Canceling order failed.",
                remote_id=self.payment_order.remote_id,
            )
            raise

    def get_order_status_from_webshop_response(self, webshop_payment: Payment | None) -> OrderStatus:
        """Determines the order status based on the payment response from the webshop."""
        # Statuses PAID, PAID_MANUALLY and REFUNDED are "final" and should not be updated from the webshop.
        if self.payment_order.status in {OrderStatus.REFUNDED, OrderStatus.PAID, OrderStatus.PAID_MANUALLY}:
            return OrderStatus(self.payment_order.status)

        older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
        webshop_payment_expires_at = local_datetime() - datetime.timedelta(minutes=older_than_minutes)

        if webshop_payment:
            if webshop_payment.status == PaymentStatus.CANCELLED.value:
                return OrderStatus.CANCELLED
            if webshop_payment.status == PaymentStatus.PAID_ONLINE.value:
                return OrderStatus.PAID
            if (
                webshop_payment.status == PaymentStatus.CREATED.value
                and webshop_payment.timestamp
                and webshop_payment.timestamp > webshop_payment_expires_at
            ):
                # User has entered payment phase in webshop (Payment is created but not yet paid),
                # give more time to complete the payment before marking the order as expired.
                return OrderStatus.DRAFT
        elif not webshop_payment and self.payment_order.expires_at > local_datetime():
            # User has not entered payment phase in webshop within the expiration time
            return OrderStatus.DRAFT

        return OrderStatus.EXPIRED

    def update_order_status(self, new_status: OrderStatus, payment_id: str = "") -> None:
        """
        Updates the PaymentOrder status and processed_at timestamp if the status has changed.

        If the order is paid, updates the reservation state to confirmed and sends a confirmation email.
        """
        if new_status == self.payment_order.status:
            return

        self.payment_order.status = new_status
        self.payment_order.processed_at = local_datetime()
        if payment_id:
            self.payment_order.payment_id = payment_id

        self.payment_order.save(update_fields=["status", "processed_at", "payment_id"])

        # If the order is paid, update the reservation state to confirmed and send confirmation email
        if (
            self.payment_order.status == OrderStatus.PAID
            and self.payment_order.reservation is not None
            and self.payment_order.reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT
        ):
            reservation = self.payment_order.reservation

            update_fields: list[str] = ["state"]
            reservation.state = ReservationStateChoice.CONFIRMED

            if reservation.access_type == AccessType.ACCESS_CODE:
                # Allow activation in Pindora to fail, will be handled by a background task.
                with suppress(Exception):
                    PindoraClient.activate_reservation_access_code(reservation=reservation)
                    reservation.access_code_is_active = True
                    update_fields.append("access_code_is_active")

            reservation.save(update_fields=update_fields)

            EmailService.send_reservation_confirmed_email(reservation=reservation)
            EmailService.send_staff_notification_reservation_made_email(reservation=reservation)

    def refresh_order_status_from_webshop(self) -> None:
        """Fetches the payment status from the webshop and updates the PaymentOrder status accordingly."""
        webshop_payment: Payment | None = self.get_order_payment_from_webshop()
        new_status: OrderStatus = self.get_order_status_from_webshop_response(webshop_payment)
        self.update_order_status(new_status, webshop_payment.payment_id if webshop_payment else "")
