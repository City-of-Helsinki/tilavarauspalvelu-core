import uuid

from django.conf import settings

from merchants.enums import OrderStatus
from merchants.models import PaymentOrder
from merchants.pruning import update_expired_orders
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.models import Reservation
from reservations.pruning import (
    prune_inactive_reservations,
    prune_recurring_reservations,
    prune_reservation_statistics,
    prune_reservation_with_inactive_payments,
)
from tilavarauspalvelu.celery import app


@app.task(name="prune_reservations")
def prune_reservations_task() -> None:
    prune_inactive_reservations()
    prune_reservation_with_inactive_payments()


@app.task(name="update_expired_orders")
def update_expired_orders_task() -> None:
    update_expired_orders()


@app.task(name="prune_reservation_statistics")
def prune_reservation_statistics_task() -> None:
    prune_reservation_statistics()


@app.task(name="prune_recurring_reservations")
def prune_recurring_reservations_task() -> None:
    prune_recurring_reservations()


@app.task(
    name="refund_paid_reservation",
    autoretry_for=(Exception,),
    max_retries=5,
    retry_backoff=True,
)
def refund_paid_reservation_task(reservation_pk: int) -> None:
    reservation = Reservation.objects.filter(pk=reservation_pk).first()
    if not reservation:
        return

    payment_order: PaymentOrder | None = PaymentOrder.objects.filter(reservation=reservation).first()
    if not payment_order:
        return

    if not settings.MOCK_VERKKOKAUPPA_API_ENABLED:
        refund = VerkkokauppaAPIClient.refund_order(order_uuid=payment_order.remote_id)
        payment_order.refund_id = refund.refund_id
    else:
        payment_order.refund_id = uuid.uuid4()
    payment_order.status = OrderStatus.REFUNDED
    payment_order.save(update_fields=["refund_id", "status"])
