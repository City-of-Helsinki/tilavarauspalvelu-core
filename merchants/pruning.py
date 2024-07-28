from datetime import timedelta
from typing import TYPE_CHECKING

from django.conf import settings

from common.date_utils import local_datetime
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.enums import OrderStatus
from merchants.models import PaymentOrder
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.types import PaymentStatus as WebShopPaymentStatus
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from reservations.models import Reservation


def update_expired_orders() -> None:
    older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
    expired_datetime = local_datetime() - timedelta(minutes=older_than_minutes)
    expired_orders = PaymentOrder.objects.filter(
        status=OrderStatus.DRAFT,
        created_at__lte=expired_datetime,
        remote_id__isnull=False,
    ).all()
    for order in expired_orders:
        try:
            result = VerkkokauppaAPIClient.get_payment(order_uuid=order.remote_id)
            if result and result.status == WebShopPaymentStatus.CANCELLED.value:
                order.status = OrderStatus.CANCELLED

            elif result and result.status == WebShopPaymentStatus.PAID_ONLINE.value:
                order.status = OrderStatus.PAID
            elif (
                result
                and result.status == WebShopPaymentStatus.CREATED.value
                and result.timestamp
                and result.timestamp > expired_datetime
            ):
                # user has entered actual payment phase from web shop; skip expire until more time passed
                continue
            else:
                order.status = OrderStatus.EXPIRED
                VerkkokauppaAPIClient.cancel_order(order_uuid=order.remote_id, user_uuid=order.reservation_user_uuid)

            order.processed_at = local_datetime()
            order.save(update_fields=["status", "processed_at"])

            # Confirm the reservation and send confirmation email
            reservation: Reservation = order.reservation
            if order.status == OrderStatus.PAID and reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT:
                reservation.state = ReservationStateChoice.CONFIRMED
                reservation.save(update_fields=["state"])
                ReservationEmailNotificationSender.send_confirmation_email(reservation=reservation)

        except GetPaymentError as err:
            SentryLogger.log_exception(err, details="Fetching order payment failed.", remote_id=order.remote_id)
        except CancelOrderError as err:
            SentryLogger.log_exception(err, details="Canceling order failed.", remote_id=order.remote_id)
