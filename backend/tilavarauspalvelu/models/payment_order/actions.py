from __future__ import annotations

import dataclasses
import datetime
from contextlib import suppress
from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import WebShopPaymentGateway, WebShopPaymentStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.verkkokauppa.payment.types import Payment

    from .model import PaymentOrder

__all__ = [
    "PaymentOrderActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentOrderActions:
    payment_order: PaymentOrder

    def set_order_as_cancelled(self) -> None:
        self.payment_order.status = OrderStatus.CANCELLED
        self.payment_order.processed_at = local_datetime()
        self.payment_order.save(update_fields=["status", "processed_at"])

    def refresh_order_status_from_webshop(self) -> None:
        """Fetches the payment status from the webshop and updates the PaymentOrder status accordingly."""
        webshop_payment = VerkkokauppaAPIClient.get_payment(order_uuid=self.payment_order.remote_id)
        new_status = self.get_order_status_from_webshop_payment(webshop_payment)
        self.update_order_status(new_status, webshop_payment.payment_id if webshop_payment else "")

    def get_order_status_from_webshop_payment(self, webshop_payment: Payment | None) -> OrderStatus:
        """Determines the order status based on the payment response from the webshop."""
        order_status = OrderStatus(self.payment_order.status)
        if order_status in OrderStatus.finalized:
            return order_status

        if webshop_payment is None:
            # User has not entered payment phase in webshop within the expiration time
            if self.payment_order.expires_at > local_datetime():
                return OrderStatus.DRAFT
            return OrderStatus.EXPIRED

        older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
        webshop_payment_expires_at = local_datetime() - datetime.timedelta(minutes=older_than_minutes)

        match webshop_payment.status:
            case WebShopPaymentStatus.CANCELLED:
                return OrderStatus.CANCELLED

            case WebShopPaymentStatus.PAID_ONLINE if webshop_payment.payment_gateway == WebShopPaymentGateway.INVOICE:
                return OrderStatus.PAID_BY_INVOICE

            case WebShopPaymentStatus.PAID_ONLINE:
                return OrderStatus.PAID

            # User has entered payment phase in webshop (Payment is created but not yet paid),
            # give more time to complete the payment before marking the order as expired.
            case WebShopPaymentStatus.CREATED if webshop_payment.timestamp > webshop_payment_expires_at:
                return OrderStatus.DRAFT

            # Other statuses are not supported by Varaamo, simply treat as expired.
            case _:
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

        reservation = self.payment_order.reservation

        if (
            new_status not in OrderStatus.paid_in_webshop
            or reservation is None
            or reservation.state != ReservationStateChoice.WAITING_FOR_PAYMENT
        ):
            return

        reservation.state = ReservationStateChoice.CONFIRMED
        reservation.save(update_fields=["state"])

        if reservation.access_type == AccessType.ACCESS_CODE:
            # Allow activation in Pindora to fail, will be handled by a background task.
            with suppress(ExternalServiceError):
                PindoraService.activate_access_code(obj=reservation)

        EmailService.send_reservation_confirmed_email(reservation=reservation)
        EmailService.send_staff_notification_reservation_made_email(reservation=reservation)
