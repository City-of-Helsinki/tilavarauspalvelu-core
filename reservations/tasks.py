import uuid

from django.conf import settings
from django.db import transaction
from django.db.models import Prefetch

from merchants.enums import OrderStatus
from merchants.models import PaymentOrder
from merchants.pruning import update_expired_orders
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservation_units.models import ReservationUnit
from reservations.models import (
    AffectingTimeSpan,
    Reservation,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
)
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


@app.task(name="update_affecting_time_spans")
def update_affecting_time_spans_task() -> None:
    AffectingTimeSpan.refresh()


@app.task(name="create_statistics_for_reservations")
def create_or_update_reservation_statistics(reservation_pks: list[int]) -> None:
    new_statistics: list[ReservationStatistic] = []
    new_statistics_units: list[ReservationStatisticsReservationUnit] = []

    reservations = (
        Reservation.objects.filter(pk__in=reservation_pks)
        .select_related(
            "user",
            "recurring_reservation",
            "recurring_reservation__ability_group",
            "recurring_reservation__allocated_time_slot",
            "deny_reason",
            "cancel_reason",
            "purpose",
            "home_city",
            "age_group",
        )
        .prefetch_related(
            Prefetch(
                "reservation_unit",
                queryset=ReservationUnit.objects.select_related("unit"),
            ),
        )
    )

    for reservation in reservations:
        statistic = ReservationStatistic.for_reservation(reservation, save=False)
        statistic_units = ReservationStatisticsReservationUnit.for_statistic(statistic, save=False)
        new_statistics.append(statistic)
        new_statistics_units.extend(statistic_units)

    fields_to_update: list[str] = [
        field.name
        for field in ReservationStatistic._meta.get_fields()
        # Update all fields that can be updated
        if field.concrete and not field.many_to_many and not field.primary_key
    ]

    with transaction.atomic():
        new_statistics = ReservationStatistic.objects.bulk_create(
            new_statistics,
            update_conflicts=True,
            update_fields=fields_to_update,
            unique_fields=["reservation"],
        )
        ReservationStatisticsReservationUnit.objects.filter(reservation_statistics__in=new_statistics).delete()
        ReservationStatisticsReservationUnit.objects.bulk_create(new_statistics_units)
