from __future__ import annotations

import dataclasses
import datetime
import uuid
from contextlib import suppress
from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import WebShopPaymentGateway, WebShopPaymentStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime
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

    def refresh_order_status_from_webshop(self) -> None:
        """Fetches the payment status from the webshop and updates the PaymentOrder status accordingly."""
        if (
            settings.MOCK_VERKKOKAUPPA_API_ENABLED
            or self.payment_order.remote_id is None
            or self.payment_order.status in OrderStatus.finalized
        ):
            return

        try:
            webshop_payment = VerkkokauppaAPIClient.get_payment(order_uuid=self.payment_order.remote_id)
        except GetPaymentError as error:
            msg = "Verkkokauppa: Failed to fetch payment status from webshop"
            details = {
                "error": str(error),
                "payment_order": self.payment_order.pk,
            }
            SentryLogger.log_message(msg, details=details)
            raise

        if webshop_payment is None:
            new_status = self.get_order_status_if_no_webshop_payment()
            payment_id: str = ""
        else:
            new_status = self.get_order_status_from_webshop_payment(webshop_payment)
            payment_id = webshop_payment.payment_id

        if new_status == self.payment_order.status:
            return

        self.payment_order.status = new_status
        self.payment_order.processed_at = local_datetime()
        self.payment_order.payment_id = payment_id
        self.payment_order.save(update_fields=["status", "processed_at", "payment_id"])

        self.complete_payment()

    def get_order_status_from_webshop_payment(self, webshop_payment: Payment) -> OrderStatus:
        is_handled_payment = self.payment_order.is_handled_payment
        is_handled_payment_overdue = self.payment_order.is_overdue_handled_payment
        is_invoiced = webshop_payment.payment_gateway == WebShopPaymentGateway.INVOICE
        webshop_payment_expiration_minutes = datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        webshop_payment_expires_at = webshop_payment.timestamp + webshop_payment_expiration_minutes
        webshop_payment_expired = webshop_payment_expires_at <= local_datetime()

        if webshop_payment.status == WebShopPaymentStatus.PAID_ONLINE:
            if is_invoiced:
                return OrderStatus.PAID_BY_INVOICE
            return OrderStatus.PAID

        if is_handled_payment:
            # Handled paid reservations expire when payment is overdue AND expired.
            # User should not be able to enter webshop if payment is overdue.
            if is_handled_payment_overdue and webshop_payment_expired:
                return OrderStatus.EXPIRED
            return OrderStatus.PENDING

        if webshop_payment.status == WebShopPaymentStatus.CANCELLED:
            return OrderStatus.CANCELLED

        # User has entered payment phase in webshop (Payment is created but not yet paid),
        # give more time to complete the payment before marking the order as expired.
        if webshop_payment.status == WebShopPaymentStatus.CREATED and not webshop_payment_expired:
            return OrderStatus.DRAFT

        # Other statuses are not supported by Varaamo, simply treat as expired.
        return OrderStatus.EXPIRED

    def get_order_status_if_no_webshop_payment(self) -> OrderStatus:
        is_handled_payment = self.payment_order.is_handled_payment
        is_handled_payment_overdue = self.payment_order.is_overdue_handled_payment
        payment_expired = self.payment_order.expires_at <= local_datetime()

        if is_handled_payment_overdue:
            return OrderStatus.EXPIRED

        if is_handled_payment:
            return OrderStatus.PENDING

        if payment_expired:
            return OrderStatus.EXPIRED

        return OrderStatus.DRAFT

    def complete_payment(self) -> None:
        """
        Update reservation state to CONFIRMED if the payment order is paid.
        Activate Pindora access code and send confirmation emails if applicable.
        """
        if self.payment_order.status not in OrderStatus.paid_in_webshop:
            return

        reservation = self.payment_order.reservation
        if reservation is None:
            return

        previous_state = reservation.state

        if self.payment_order.is_handled_payment:
            if previous_state != ReservationStateChoice.CONFIRMED:
                return
        elif previous_state != ReservationStateChoice.WAITING_FOR_PAYMENT:
            return

        reservation.state = ReservationStateChoice.CONFIRMED
        reservation.save(update_fields=["state"])

        if reservation.access_type == AccessType.ACCESS_CODE and not reservation.access_code_is_active:
            # Allow activation in Pindora to fail, will be handled by a background task.
            with suppress(ExternalServiceError):
                PindoraService.activate_access_code(obj=reservation)

        if previous_state == ReservationStateChoice.WAITING_FOR_PAYMENT:
            EmailService.send_reservation_confirmed_email(reservation=reservation)
            EmailService.send_reservation_confirmed_staff_notification_email(reservation=reservation)

    def cancel_together_with_verkkokauppa(self, *, cancel_on_error: bool = False) -> None:
        if self.payment_order.status not in OrderStatus.can_be_cancelled_statuses:
            return

        if not settings.MOCK_VERKKOKAUPPA_API_ENABLED and self.payment_order.remote_id is not None:
            try:
                webshop_order = VerkkokauppaAPIClient.cancel_order(
                    order_uuid=self.payment_order.remote_id,
                    user_uuid=self.payment_order.reservation_user_uuid,
                )

                # Don't update if order is missing or something other than cancelled
                if webshop_order is None or webshop_order.status != WebShopOrderStatus.CANCELLED:
                    return

            # If there is an unexpected response or error from verkkokauppa,
            # payment order should still be cancelled
            except CancelOrderError as error:
                msg = "Verkkokauppa: Failed to cancel order"
                details = {
                    "error": str(error),
                    "payment_order": self.payment_order.pk,
                }
                SentryLogger.log_message(msg, details=details)

                if not cancel_on_error:
                    raise

        self.payment_order.status = OrderStatus.CANCELLED
        self.payment_order.processed_at = local_datetime()
        self.payment_order.save(update_fields=["status", "processed_at"])

    def issue_refund_in_verkkokauppa(self) -> None:
        if self.payment_order.status not in OrderStatus.can_be_refunded_statuses:
            return

        # Refunds can only be made for orders paid through webshop.
        if self.payment_order.remote_id is None:
            return

        # Refund has already been issued
        if self.payment_order.refund_id is not None:
            return

        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            self.payment_order.refund_id = uuid.uuid4()
            self.payment_order.status = OrderStatus.REFUNDED
            self.payment_order.processed_at = local_datetime()
            self.payment_order.save(update_fields=["refund_id", "status", "processed_at"])
            return

        refund = VerkkokauppaAPIClient.refund_order(order_uuid=self.payment_order.remote_id)

        # 'status' and 'processed_at' are updated from the webshop webhooks
        self.payment_order.refund_id = refund.refund_id
        self.payment_order.save(update_fields=["refund_id"])

    def is_refundable(self) -> bool:
        return (
            # Is a paid reservation
            self.payment_order.reservation is not None
            and self.payment_order.reservation.price_net > 0
            # Has been paid in webshop using online payment
            and self.payment_order.status == OrderStatus.PAID
            # Has not been refunded already
            and self.payment_order.refund_id is None
        )

    def is_cancellable_invoice(self) -> bool:
        return (
            # Is a paid reservation
            self.payment_order.reservation is not None
            and self.payment_order.reservation.price_net > 0
            # Reservation start date is not in the past
            and local_date() <= self.payment_order.reservation.begins_at.astimezone(DEFAULT_TIMEZONE).date()
            # Has been paid in webshop using invoice
            and self.payment_order.status == OrderStatus.PAID_BY_INVOICE
        )

    def has_no_payment_through_webshop(self) -> bool:
        return self.payment_order.status in OrderStatus.no_payment_from_webshop_statuses
