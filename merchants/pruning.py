import contextlib
from datetime import timedelta

from django.conf import settings
from django.db.transaction import atomic

from common.date_utils import local_datetime
from merchants.enums import OrderStatus
from merchants.models import PaymentOrder
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.payment.exceptions import GetPaymentError


def update_expired_orders() -> None:
    older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
    expired_datetime = local_datetime() - timedelta(minutes=older_than_minutes)
    expired_orders = PaymentOrder.objects.filter(
        status=OrderStatus.DRAFT,
        created_at__lte=expired_datetime,
        remote_id__isnull=False,
    ).all()

    for payment_order in expired_orders:
        # Do not update the PaymentOrder status if an error occurs
        with contextlib.suppress(GetPaymentError, CancelOrderError), atomic():
            payment_order.refresh_order_status_from_webshop()

            if payment_order.status == OrderStatus.EXPIRED:
                payment_order.cancel_order_in_webshop()
