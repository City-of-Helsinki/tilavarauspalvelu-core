from datetime import datetime, timedelta

from django.utils.timezone import get_default_timezone

from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.types import PaymentStatus as WebShopPaymentStatus
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from reservations.email_utils import send_confirmation_email
from reservations.models import Reservation
from utils.sentry import log_exception_to_sentry

DEFAULT_TIMEZONE = get_default_timezone()


def update_expired_orders(older_than_minutes: int) -> None:
    expired_datetime = datetime.now(tz=DEFAULT_TIMEZONE) - timedelta(minutes=older_than_minutes)
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

            order.processed_at = datetime.now(tz=DEFAULT_TIMEZONE)
            order.save()

            # Confirm the reservation and send confirmation email
            reservation: Reservation = order.reservation
            if order.status == OrderStatus.PAID and reservation.state == ReservationStateChoice.WAITING_FOR_PAYMENT:
                reservation.state = ReservationStateChoice.CONFIRMED
                reservation.save()
                send_confirmation_email(reservation)

        except GetPaymentError as err:
            log_exception_to_sentry(err, details="Fetching order payment failed.", remote_id=order.remote_id)
        except CancelOrderError as err:
            log_exception_to_sentry(err, details="Canceling order failed.", remote_id=order.remote_id)
