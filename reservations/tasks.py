from merchants.models import PaymentOrder
from merchants.pruning import update_expired_orders
from merchants.verkkokauppa.payment.requests import refund_order
from reservations.models import Reservation
from tilavarauspalvelu.celery import app

from .pruning import (
    prune_inactive_reservations,
    prune_recurring_reservations,
    prune_reservation_statistics,
    prune_reservations_with_inactive_payment,
)

# The pruning task will be run periodically at every PRUNE_INTERVAL_SECONDS
PRUNE_INTERVAL_SECONDS = 60 * 5

# Reservations older than PRUNE_OLDER_THAN_MINUTES will be deleted when the task is run
PRUNE_OLDER_THAN_MINUTES = 20

PRUNE_WITH_ORDERS_OLDER_THAN_MINUTES = 5

REMOVE_STATS_OLDER_THAN_YEARS = 5

REMOVE_RECURRINGS_OLDER_THAN_DAYS = 1


@app.task(name="prune_reservations")
def _prune_reservations() -> None:
    prune_inactive_reservations(PRUNE_OLDER_THAN_MINUTES)


@app.task(name="prune_reservations_with_inactive_payment")
def prune_reservations_with_inactive_payment_task() -> None:
    prune_reservations_with_inactive_payment(PRUNE_WITH_ORDERS_OLDER_THAN_MINUTES)


@app.task(name="update_expired_orders")
def update_expired_orders_task(older_than_minutes=PRUNE_WITH_ORDERS_OLDER_THAN_MINUTES):
    update_expired_orders(PRUNE_WITH_ORDERS_OLDER_THAN_MINUTES)


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs) -> None:
    sender.add_periodic_task(
        PRUNE_INTERVAL_SECONDS, _prune_reservations.s(), name="reservations_pruning"
    )


@app.task(name="prune_reservation_statistics")
def prune_reservation_statistics_task(older_than_years=REMOVE_STATS_OLDER_THAN_YEARS):
    prune_reservation_statistics(older_than_years=older_than_years)


@app.task(name="prune_recurring_reservations")
def prune_recurring_reservations_task() -> None:
    prune_recurring_reservations(REMOVE_RECURRINGS_OLDER_THAN_DAYS)


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

    payment_order = PaymentOrder.objects.filter(reservation=reservation).first()
    if not payment_order:
        return

    refund = refund_order(payment_order.remote_id)
    payment_order.refund_id = refund.refund_id
    payment_order.save()
