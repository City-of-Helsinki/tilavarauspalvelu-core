from datetime import datetime, timedelta

from django.conf import settings
from django.utils.timezone import get_default_timezone
from sentry_sdk import capture_exception, push_scope

from reservations.email_utils import send_confirmation_email
from reservations.models import STATE_CHOICES, Reservation

from .models import OrderStatus, PaymentOrder
from .verkkokauppa.order.exceptions import CancelOrderError
from .verkkokauppa.order.requests import cancel_order
from .verkkokauppa.payment.exceptions import GetPaymentError
from .verkkokauppa.payment.requests import get_payment
from .verkkokauppa.payment.types import PaymentStatus as WebShopPaymentStatus

TIMEZONE = get_default_timezone()


def update_expired_orders(older_than_minutes: int) -> None:
    expired_datetime = datetime.now(tz=TIMEZONE) - timedelta(minutes=older_than_minutes)
    expired_orders = PaymentOrder.objects.filter(
        status=OrderStatus.DRAFT,
        created_at__lte=expired_datetime,
        remote_id__isnull=False,
    ).all()
    for order in expired_orders:
        try:
            result = get_payment(order.remote_id, settings.VERKKOKAUPPA_NAMESPACE)
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
                cancel_order(order.remote_id, order.reservation_user_uuid)

            order.processed_at = datetime.now(tz=TIMEZONE)
            order.save()

            # Confirm the reservation and send confirmation email
            reservation: Reservation = order.reservation
            if (
                order.status == OrderStatus.PAID
                and reservation.state == STATE_CHOICES.WAITING_FOR_PAYMENT
            ):
                reservation.state = STATE_CHOICES.CONFIRMED
                reservation.save()
                send_confirmation_email(reservation)

        except GetPaymentError as err:
            with push_scope() as scope:
                scope.set_extra("details", "Fetching order payment failed")
                scope.set_extra("remote-id", order.remote_id)
                capture_exception(err)
        except CancelOrderError as err:
            with push_scope() as scope:
                scope.set_extra("details", "Canceling order failed")
                scope.set_extra("remote-id", order.remote_id)
                capture_exception(err)
