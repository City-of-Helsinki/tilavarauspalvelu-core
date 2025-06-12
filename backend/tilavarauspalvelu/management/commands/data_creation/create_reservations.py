from __future__ import annotations

import datetime
import random
import uuid
from typing import TYPE_CHECKING

from django.db import models

from tilavarauspalvelu.enums import (
    MunicipalityChoice,
    OrderStatus,
    PaymentType,
    ReservationCancelReasonChoice,
    ReservationKind,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
    Weekday,
)
from tilavarauspalvelu.models import (
    PaymentOrder,
    RejectedOccurrence,
    Reservation,
    ReservationDenyReason,
    ReservationUnit,
    ReservationUnitPricing,
    User,
)
from utils.date_utils import (
    DEFAULT_TIMEZONE,
    combine,
    get_date_range,
    get_periods_between,
    local_date,
    local_datetime,
    next_date_matching_weekday,
)

from tests.factories import RejectedOccurrenceFactory, ReservationSeriesFactory
from tests.factories.payment_order import PaymentOrderBuilder
from tests.factories.reservation import NextDateError, ReservationBuilder

from .create_reservation_related_things import _create_deny_reasons
from .create_reservation_units import _create_reservation_unit_for_reservation_series
from .utils import sample_qs, weighted_choice, with_logs

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import TermsOfUseTypeChoices
    from tilavarauspalvelu.models import (
        AgeGroup,
        OriginHaukiResource,
        ReservationMetadataSet,
        ReservationPurpose,
        ReservationSeries,
        ReservationUnitCancellationRule,
        TaxPercentage,
        TermsOfUse,
    )
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet

    from .utils import SetName


@with_logs
def _create_reservations(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
) -> None:
    _create_normal_reservations(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_full_day_reservations(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_reservations_for_reservation_units_affecting_other_reservation_units(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )


@with_logs
def _create_normal_reservations(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
) -> None:
    """
    Create reservations for all reservation units that:
    - Are not archived
    - Have at least one space
    - Don't have a limit on number of reservations per user
    - Don't require full day booking
    - Have a hauki resource (=> have reservable time slots)
    - Have at least one pricing
    - Are not in a space or resource hierarchy
    - Are only directly bookable
    - Don't already have a reservations
    """
    reservation_units: list[ReservationUnit] = list(
        ReservationUnit.objects.filter(
            is_archived=False,
            spaces__isnull=False,
            max_reservations_per_user=None,
            reservation_block_whole_day=False,
            origin_hauki_resource__isnull=False,
            pricings__isnull=False,
            spaces__parent__isnull=True,
            spaces__children__isnull=True,
            resources__isnull=True,
            reservation_kind=ReservationKind.DIRECT,
            reservations__isnull=True,
        )
        .prefetch_related(
            # Prefetch only the active pricing for each reservation unit
            models.Prefetch("pricings", ReservationUnitPricing.objects.active()),
        )
        .order_by("pk")
    )

    user = User.objects.get(username="tvp")

    reservation_type_choices: list[ReservationTypeChoice] = [
        ReservationTypeChoice.NORMAL,
        ReservationTypeChoice.BEHALF,
        ReservationTypeChoice.STAFF,
    ]

    reservee_type_choice: list[ReserveeType] = [
        ReserveeType.INDIVIDUAL,
        ReserveeType.COMPANY,
        ReserveeType.NONPROFIT,
    ]

    handling_state_choices: list[ReservationStateChoice] = [
        ReservationStateChoice.REQUIRES_HANDLING,
        ReservationStateChoice.CONFIRMED,
    ]

    reservations: list[Reservation] = []
    payment_orders: list[PaymentOrder] = []

    # --- Create reservations -------------------------------------------------------------------------------------

    # Create some reservations in the past, but mostly in the future
    start_date = local_date() - datetime.timedelta(days=3)
    number_of_days_that_have_reservations: int = 14

    for reservation_unit in reservation_units:
        # 1/10 of reservation units are "busy", meaning that there are more reservations per day.
        busy = weighted_choice([True, False], weights=[1, 9])
        if busy:
            reservation_unit.name = f"{reservation_unit.name} (kiireinen)"
            reservation_unit.name_fi = reservation_unit.name
            reservation_unit.name_en = f"{reservation_unit.name_en} (busy)"
            reservation_unit.name_sv = f"{reservation_unit.name_sv} (upptagen)"

        # Space out reservations such that no reservation's buffers overlap with its
        # next or previous reservation's reservable time (buffers may still overlap).
        max_buffer = max(reservation_unit.buffer_time_before, reservation_unit.buffer_time_after)
        min_interval_hours = max(int(max_buffer.total_seconds() / 3600), 1 if busy else 5)
        max_interval_hours = max(min_interval_hours + 1, 3 if busy else 10)

        pricing: ReservationUnitPricing = next(iter(reservation_unit.pricings.all()), None)
        assert pricing is not None, "Reservation unit must have at least one pricing"

        payment_type = PaymentType(pricing.payment_type)

        reservation_state: ReservationStateChoice = ReservationStateChoice.CONFIRMED
        handled_at: datetime.datetime | None = None
        applying_for_free_of_charge: bool = False
        free_of_charge_reason: str | None = None
        deny_reason: ReservationDenyReason | None = None
        handled_payment_due_by: datetime.datetime | None = None

        for reservation_date in get_date_range(start_date, number=number_of_days_that_have_reservations):
            if reservation_unit.require_reservation_handling:
                reservation_state = weighted_choice(handling_state_choices, weights=[2, 1])
                if reservation_state == ReservationStateChoice.CONFIRMED:
                    handled_at = local_datetime()

            begin_time = datetime.time(hour=random.randint(6, 10), tzinfo=DEFAULT_TIMEZONE)
            begin_datetime = combine(reservation_date, begin_time)

            while reservation_date == begin_datetime.date():
                customer_type = weighted_choice(reservee_type_choice, weights=[5, 1, 1])
                reservation_type = weighted_choice(reservation_type_choices, weights=[5, 1, 1])

                if pricing.highest_price != pricing.lowest_price:
                    applying_for_free_of_charge = random.choice([True, False])
                    if applying_for_free_of_charge:
                        free_of_charge_reason = "Reason for applying for free of charge"

                    if (
                        reservation_unit.require_reservation_handling
                        and reservation_state == ReservationStateChoice.CONFIRMED
                    ):
                        handled_payment_due_by = begin_datetime - datetime.timedelta(minutes=50)

                try:
                    reservation = (
                        ReservationBuilder()
                        .for_user(user)
                        .for_reservation_unit(reservation_unit)
                        .for_reservee_type(customer_type)
                        .starting_at(begin_datetime, reservation_unit, pricing=pricing)
                        .build(
                            reservation_unit=reservation_unit,
                            type=reservation_type,
                            state=reservation_state,
                            #
                            handled_at=handled_at,
                            confirmed_at=local_datetime(),
                            created_at=local_datetime(),
                            #
                            applying_for_free_of_charge=applying_for_free_of_charge,
                            free_of_charge_reason=free_of_charge_reason,
                            #
                            purpose=random.choice(reservation_purposes),
                            age_group=random.choice(age_groups),
                            municipality=MunicipalityChoice.HELSINKI,
                            #
                            deny_reason=deny_reason,
                            cancel_reason=None,
                        )
                    )

                # Reservation doesn't fit on this date, go to next date.
                except NextDateError:
                    break

                reservations.append(reservation)

                if pricing.highest_price > 0:
                    payment_order = _build_payment_order(reservation, payment_type, handled_payment_due_by)
                    payment_orders.append(payment_order)

                begin_datetime += datetime.timedelta(hours=random.randint(min_interval_hours, max_interval_hours))

    ReservationUnit.objects.bulk_update(reservation_units, fields=["name", "name_fi", "name_en", "name_sv"])
    Reservation.objects.bulk_create(reservations)
    PaymentOrder.objects.bulk_create(payment_orders)

    _deny_and_cancel_normal_reservations()


def _build_payment_order(
    reservation: Reservation,
    payment_type: PaymentType,
    handled_payment_due_by: datetime.datetime | None = None,
) -> PaymentOrder:
    payment_order_builder = PaymentOrderBuilder().set(
        language=reservation.user.get_preferred_language(),
        price_net=reservation.price_net,
        price_vat=reservation.price_vat_amount,
        price_total=reservation.price,
        reservation=reservation,
        reservation_user_uuid=reservation.user.uuid,
        payment_type=payment_type,
    )

    if payment_type == PaymentType.ON_SITE:
        return payment_order_builder.build(status=OrderStatus.PAID_MANUALLY)

    if handled_payment_due_by is not None:
        payment_order_builder = payment_order_builder.set(handled_payment_due_by=handled_payment_due_by)

        is_still_pending = weighted_choice([True, False], weights=[1, 3])
        if is_still_pending:
            return payment_order_builder.build(status=OrderStatus.PENDING)

    if payment_type == PaymentType.ONLINE_OR_INVOICE:
        return payment_order_builder.for_mock_order(reservation).build(status=OrderStatus.PAID_BY_INVOICE)

    return payment_order_builder.for_mock_order(reservation).build(status=OrderStatus.PAID)


def _deny_and_cancel_normal_reservations() -> None:
    not_on_site = Reservation.objects.exclude(payment_order__status=OrderStatus.PAID_MANUALLY)

    confirmed = not_on_site.filter(state=ReservationStateChoice.CONFIRMED)
    in_handling = not_on_site.filter(state=ReservationStateChoice.REQUIRES_HANDLING)

    free = confirmed.filter(payment_order__isnull=True)
    free_in_handling = in_handling.filter(payment_order__isnull=True)

    paid = confirmed.filter(payment_order__isnull=False)
    paid_in_handling = in_handling.filter(payment_order__isnull=False)

    paid_direct = paid.filter(handled_at__isnull=True)
    paid_handled = paid.filter(handled_at__isnull=False)

    paid_direct_online = paid_direct.filter(payment_order__status=OrderStatus.PAID)
    paid_direct_invoiced = paid_direct.filter(payment_order__status=OrderStatus.PAID_BY_INVOICE)

    paid_handled_online = paid_handled.filter(payment_order__status=OrderStatus.PAID)
    paid_handled_invoiced = paid_handled.filter(payment_order__status=OrderStatus.PAID_BY_INVOICE)

    now = local_datetime()
    paid_handled_pending = paid_handled.filter(payment_order__status=OrderStatus.PENDING)
    paid_handled_pending_due = paid_handled_pending.filter(payment_order__handled_payment_due_by__gt=now)
    paid_handled_pending_overdue = paid_handled_pending.filter(payment_order__handled_payment_due_by__lte=now)

    deny_reasons = _create_deny_reasons()

    # Deny some reservations in handling
    _deny_reservations(sample_qs(free_in_handling, size=5), deny_reasons)
    _deny_reservations(sample_qs(paid_in_handling, size=5), deny_reasons)

    # Cancel some free reservations
    _cancel_reservations(sample_qs(free, size=5))

    # Cancel some paid direct reservations
    _cancel_reservations(sample_qs(paid_direct_online, size=2))
    _cancel_reservations(sample_qs(paid_direct_invoiced, size=2))

    # Cancel some paid handled reservations
    _cancel_reservations(sample_qs(paid_handled_online, size=2))
    _cancel_reservations(sample_qs(paid_handled_invoiced, size=2))
    _cancel_reservations(sample_qs(paid_handled_pending_due, size=2))

    # Cancel all handled pending reservations which are overdue
    _cancel_reservations(paid_handled_pending_overdue)


def _cancel_reservations(qs: ReservationQuerySet) -> None:
    reservations: list[Reservation] = []
    payment_orders: list[PaymentOrder] = []
    cancel_reasons = ReservationCancelReasonChoice.user_selectable

    now = local_datetime()

    reservation: Reservation
    for reservation in qs:
        reservation.state = ReservationStateChoice.CANCELLED
        reservation.cancel_details = "Cancelled by reservee"
        reservation.cancel_reason = random.choice(cancel_reasons)
        reservations.append(reservation)

        if hasattr(reservation, "payment_order"):
            payment_order: PaymentOrder = reservation.payment_order

            overdue = payment_order.handled_payment_due_by is not None and payment_order.handled_payment_due_by <= now

            match payment_order.status:
                case OrderStatus.PAID:
                    payment_order.status = OrderStatus.REFUNDED
                    payment_order.refund_id = uuid.uuid4()

                case OrderStatus.PAID_BY_INVOICE:
                    payment_order.status = OrderStatus.CANCELLED
                    payment_order.processed_at = reservation.begins_at - datetime.timedelta(days=3)

                case OrderStatus.PENDING if overdue:
                    reservation.cancel_reason = ReservationCancelReasonChoice.NOT_PAID
                    reservation.cancel_details = "Cancelled due to no payment"
                    payment_order.status = OrderStatus.EXPIRED
                    payment_order.processed_at = reservation.begins_at - datetime.timedelta(days=3)

                case OrderStatus.PENDING:
                    reservation.cancel_details = "Cancelled by the reservee"
                    payment_order.status = OrderStatus.CANCELLED
                    payment_order.processed_at = reservation.begins_at - datetime.timedelta(days=3)

                case _:
                    msg = f"Cannot cancel payment order in status '{payment_order.status}'"
                    raise ValueError(msg)

            payment_orders.append(payment_order)

    Reservation.objects.bulk_update(reservations, fields=["state", "cancel_details", "cancel_reason"])
    PaymentOrder.objects.bulk_update(payment_orders, fields=["status", "refund_id", "processed_at"])


def _deny_reservations(qs: ReservationQuerySet, deny_reasons: list[ReservationDenyReason]) -> None:
    reservations: list[Reservation] = []
    payment_orders: list[PaymentOrder] = []

    reservation: Reservation
    for reservation in qs:
        reservation.state = ReservationStateChoice.DENIED
        reservation.handling_details = "Denied by handler"
        reservation.handled_at = local_datetime()
        reservation.deny_reason = random.choice(deny_reasons)
        reservations.append(reservation)

        if hasattr(reservation, "payment_order"):
            payment_order: PaymentOrder = reservation.payment_order

            # Handler can choose to refund the payment, most of the time they do
            action = weighted_choice([OrderStatus.REFUNDED, OrderStatus.CANCELLED], weights=[3, 1])

            match payment_order.status:
                case OrderStatus.PAID if action == OrderStatus.REFUNDED:
                    payment_order.status = OrderStatus.REFUNDED
                    payment_order.refund_id = uuid.uuid4()

                # Invoices are always cancelled, since no payment has been made
                case OrderStatus.PAID | OrderStatus.PAID_BY_INVOICE | OrderStatus.PENDING:
                    payment_order.status = OrderStatus.CANCELLED
                    payment_order.processed_at = reservation.begins_at - datetime.timedelta(days=3)

                case _:
                    msg = f"Cannot deny payment order in status '{payment_order.status}'"
                    raise ValueError(msg)

            payment_orders.append(payment_order)

    Reservation.objects.bulk_update(reservations, fields=["state", "handling_details", "handled_at", "deny_reason"])
    PaymentOrder.objects.bulk_update(payment_orders, fields=["status", "refund_id", "processed_at"])


@with_logs
def _create_full_day_reservations(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
) -> None:
    """
    Create reservations for all reservation units that require full day booking.
    Keep all the other restrictions on reservation units the same as in the '_create_normal_reservations' method.
    """
    reservation_units: list[ReservationUnit] = list(
        ReservationUnit.objects.filter(
            is_archived=False,
            spaces__isnull=False,
            max_reservations_per_user=None,
            reservation_block_whole_day=True,  # note this!
            origin_hauki_resource__isnull=False,
            pricings__isnull=False,
            spaces__parent__isnull=True,
            spaces__children__isnull=True,
            resources__isnull=True,
            reservation_kind=ReservationKind.DIRECT,
            reservations__isnull=True,
        )
        .prefetch_related(
            # Prefetch only the active pricing for each reservation unit
            models.Prefetch("pricings", ReservationUnitPricing.objects.active()),
        )
        .order_by("pk")
    )

    user = User.objects.get(username="tvp")

    reservee_type_choices: list[ReserveeType] = [
        ReserveeType.INDIVIDUAL,
        ReserveeType.COMPANY,
        ReserveeType.NONPROFIT,
    ]

    reservation_type_choices: list[ReservationTypeChoice] = [
        ReservationTypeChoice.NORMAL,
        ReservationTypeChoice.BEHALF,
        ReservationTypeChoice.STAFF,
    ]

    reservations: list[Reservation] = []

    # --- Create reservations -------------------------------------------------------------------------------------

    start_date = local_date()

    for reservation_unit in reservation_units:
        handled_at: datetime.datetime | None = None
        if reservation_unit.require_reservation_handling:
            handled_at = local_datetime()

        pricing: ReservationUnitPricing = next(iter(reservation_unit.pricings.all()), None)
        assert pricing is not None, "Reservation unit must have at least one pricing"

        for reservation_date in get_date_range(start_date, number=14):
            skip_day = weighted_choice([True, False], weights=[1, 5])
            if skip_day:
                continue

            begin_time = datetime.time(hour=random.randint(6, 10), tzinfo=DEFAULT_TIMEZONE)
            begin_datetime = combine(reservation_date, begin_time)

            customer_type = weighted_choice(reservee_type_choices, weights=[5, 1, 1])
            reservation_type = weighted_choice(reservation_type_choices, weights=[5, 1, 1])

            reservation = (
                ReservationBuilder()
                .for_user(user)
                .for_reservation_unit(reservation_unit)
                .for_reservee_type(customer_type)
                .starting_at(begin_datetime, reservation_unit, pricing=pricing)
                .build(
                    reservation_unit=reservation_unit,
                    type=reservation_type,
                    state=ReservationStateChoice.CONFIRMED,
                    #
                    handled_at=handled_at,
                    confirmed_at=local_datetime(),
                    #
                    applying_for_free_of_charge=False,
                    free_of_charge_reason=None,
                    #
                    purpose=random.choice(reservation_purposes),
                    age_group=random.choice(age_groups),
                    municipality=MunicipalityChoice.HELSINKI,
                )
            )
            reservations.append(reservation)

    Reservation.objects.bulk_create(reservations)


@with_logs
def _create_reservations_for_reservation_units_affecting_other_reservation_units(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
) -> None:
    """
    Create reservations for all reservation units that are in a space or resource hierarchy.
    Keep all the other restrictions on reservation units the same as in the '_create_normal_reservations' method.
    """
    base_qs = (
        ReservationUnit.objects.filter(
            is_archived=False,
            spaces__isnull=False,
            max_reservations_per_user=None,
            reservation_block_whole_day=False,
            origin_hauki_resource__isnull=False,
            pricings__isnull=False,
            reservation_kind=ReservationKind.DIRECT,
            reservations__isnull=True,
        )
        .prefetch_related(
            # Prefetch only the active pricing for each reservation unit
            models.Prefetch("pricings", ReservationUnitPricing.objects.active()),
        )
        .order_by("pk")
    )

    space_reservation_units: list[ReservationUnit] = list(
        base_qs.filter(
            resources__isnull=True,
        ).filter(
            # Either has parent or child spaces or both
            models.Q(
                spaces__parent__isnull=False,
                spaces__children__isnull=True,
            )
            | models.Q(
                spaces__parent__isnull=True,
                spaces__children__isnull=False,
            )
            | models.Q(
                spaces__parent__isnull=False,
                spaces__children__isnull=False,
            )
        )
    )

    resource_reservation_units: list[ReservationUnit] = list(
        base_qs.filter(
            resources__isnull=False,
            spaces__parent__isnull=True,
            spaces__children__isnull=True,
        )
    )

    user = User.objects.get(username="tvp")

    reservee_type_choices: list[ReserveeType] = [
        ReserveeType.INDIVIDUAL,
        ReserveeType.COMPANY,
        ReserveeType.NONPROFIT,
    ]

    reservations: list[Reservation] = []

    # --- Create reservations -------------------------------------------------------------------------------------

    reservation_date = local_date()

    for reservation_unit in space_reservation_units:
        pricing: ReservationUnitPricing = next(iter(reservation_unit.pricings.all()), None)
        assert pricing is not None, "Reservation unit must have at least one pricing"

        begin_time = datetime.time(hour=random.randint(8, 12), tzinfo=DEFAULT_TIMEZONE)
        begin_datetime = combine(reservation_date, begin_time)

        customer_type = weighted_choice(reservee_type_choices, weights=[5, 1, 1])

        reservation = (
            ReservationBuilder()
            .for_user(user)
            .for_reservation_unit(reservation_unit)
            .for_reservee_type(customer_type)
            .starting_at(begin_datetime, reservation_unit, pricing=pricing)
            .build(
                reservation_unit=reservation_unit,
                type=ReservationTypeChoice.NORMAL,
                state=ReservationStateChoice.CONFIRMED,
                #
                handled_at=None,
                confirmed_at=local_datetime(),
                #
                applying_for_free_of_charge=False,
                free_of_charge_reason=None,
                #
                purpose=random.choice(reservation_purposes),
                age_group=random.choice(age_groups),
                municipality=MunicipalityChoice.HELSINKI,
            )
        )
        reservations.append(reservation)

        # Only one reservation per day, so that we don't accidentally create overlapping reservations
        reservation_date += datetime.timedelta(days=1)

    for reservation_unit in resource_reservation_units:
        pricing: ReservationUnitPricing = next(iter(reservation_unit.pricings.all()), None)
        assert pricing is not None, "Reservation unit must have at least one pricing"

        begin_time = datetime.time(hour=random.randint(8, 12), tzinfo=DEFAULT_TIMEZONE)
        begin_datetime = combine(reservation_date, begin_time)

        customer_type = weighted_choice(reservee_type_choices, weights=[5, 1, 1])

        reservation = (
            ReservationBuilder()
            .for_user(user)
            .for_reservation_unit(reservation_unit)
            .for_reservee_type(customer_type)
            .starting_at(begin_datetime, reservation_unit, pricing=pricing)
            .build(
                reservation_unit=reservation_unit,
                type=ReservationTypeChoice.NORMAL,
                state=ReservationStateChoice.CONFIRMED,
                #
                handled_at=None,
                confirmed_at=local_datetime(),
                #
                applying_for_free_of_charge=False,
                free_of_charge_reason=None,
                #
                purpose=random.choice(reservation_purposes),
                age_group=random.choice(age_groups),
                municipality=MunicipalityChoice.HELSINKI,
            )
        )
        reservations.append(reservation)

        # Only one reservation per day, so that we don't accidentally create overlapping reservations
        reservation_date += datetime.timedelta(days=1)

    Reservation.objects.bulk_create(reservations)


@with_logs
def _create_reservation_series(
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    cancellation_rules: list[ReservationUnitCancellationRule],
    hauki_resources: list[OriginHaukiResource],
    tax_percentage: TaxPercentage,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
) -> None:
    user = User.objects.get(username="tvp")

    reservation_unit = _create_reservation_unit_for_reservation_series(
        metadata_sets=metadata_sets,
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
        hauki_resources=hauki_resources,
        tax_percentage=tax_percentage,
    )

    _create_past_reservation_series(
        name="Viime kauden futistreenit",
        weekdays=[Weekday.MONDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_future_reservation_series(
        name="Tulevan kauden futistreenit",
        weekdays=[Weekday.MONDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_ongoing_reservation_series(
        name="Aikuisten treenit kaksi kertaa viikossa",
        weekdays=[Weekday.WEDNESDAY, Weekday.FRIDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
    )

    _create_ongoing_reservation_series(
        name="Ajoittaiset viikonloppupelit",
        weekdays=[Weekday.SATURDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cancel_random=3,
        deny_random=3,
        reject_random=3,
    )


@with_logs
def _create_past_reservation_series(
    name: str,
    weekdays: list[Weekday],
    reservation_unit: ReservationUnit,
    user: User,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    today = local_date()

    age_group = random.choice(age_groups)
    series = ReservationSeriesFactory.create(
        name=name,
        #
        begin_date=today - datetime.timedelta(days=90),
        end_date=today - datetime.timedelta(days=1),
        #
        end_time=datetime.time(hour=11, minute=0),
        begin_time=datetime.time(hour=9, minute=0),
        #
        weekdays=weekdays,
        reservation_unit=reservation_unit,
        user=user,
        age_group=age_group,
    )
    _create_reservations_for_series(
        series=series,
        reservation_purposes=reservation_purposes,
        age_group=age_group,
        cancel_random=cancel_random,
        deny_random=deny_random,
        reject_random=reject_random,
    )


@with_logs
def _create_future_reservation_series(
    name: str,
    weekdays: list[Weekday],
    reservation_unit: ReservationUnit,
    user: User,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    today = local_date()

    age_group = random.choice(age_groups)
    series = ReservationSeriesFactory.create(
        name=name,
        #
        begin_date=today + datetime.timedelta(days=1),
        end_date=today + datetime.timedelta(days=90),
        #
        begin_time=datetime.time(hour=8, minute=0),
        end_time=datetime.time(hour=10, minute=0),
        #
        weekdays=weekdays,
        reservation_unit=reservation_unit,
        user=user,
        age_group=age_group,
    )
    _create_reservations_for_series(
        series=series,
        reservation_purposes=reservation_purposes,
        age_group=age_group,
        cancel_random=cancel_random,
        deny_random=deny_random,
        reject_random=reject_random,
    )


@with_logs
def _create_ongoing_reservation_series(
    name: str,
    weekdays: list[Weekday],
    reservation_unit: ReservationUnit,
    user: User,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    today = local_date()

    age_group = random.choice(age_groups)
    series = ReservationSeriesFactory.create(
        name=name,
        #
        begin_date=today - datetime.timedelta(days=30),
        end_date=today + datetime.timedelta(days=60),
        #
        begin_time=datetime.time(hour=14, minute=0),
        end_time=datetime.time(hour=16, minute=0),
        #
        weekdays=weekdays,
        reservation_unit=reservation_unit,
        user=user,
        age_group=age_group,
    )
    _create_reservations_for_series(
        series=series,
        reservation_purposes=reservation_purposes,
        age_group=age_group,
        cancel_random=cancel_random,
        deny_random=deny_random,
        reject_random=reject_random,
    )


def _create_reservations_for_series(
    series: ReservationSeries,
    reservation_purposes: list[ReservationPurpose],
    age_group: AgeGroup,
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    pricing: ReservationUnitPricing | None = series.reservation_unit.pricings.active().first()
    assert pricing is not None, "Reservation unit must have at least one pricing"

    weekdays: list[Weekday] = [Weekday(weekday) for weekday in series.weekdays]

    reservations: list[Reservation] = []
    occurrences: list[RejectedOccurrence] = []

    for weekday in weekdays:
        begin_date = next_date_matching_weekday(series.begin_date, weekday)

        periods = get_periods_between(
            start_date=begin_date,
            end_date=series.end_date,
            start_time=series.begin_time,
            end_time=series.end_time,
            interval=series.recurrence_in_days,
            tzinfo=DEFAULT_TIMEZONE,
        )

        buffer_time_before = series.reservation_unit.actions.get_actual_before_buffer(series.begin_time)
        buffer_time_after = series.reservation_unit.actions.get_actual_before_buffer(series.end_time)

        for begin, end in periods:
            reservation = (
                ReservationBuilder()
                .for_user(series.user)
                .for_reservation_unit(series.reservation_unit)
                .for_nonprofit()
                .build(
                    reservation_unit=series.reservation_unit,
                    reservation_series=series,
                    #
                    begins_at=begin,
                    ends_at=end,
                    buffer_time_before=buffer_time_before,
                    buffer_time_after=buffer_time_after,
                    #
                    type=ReservationTypeChoice.BEHALF,
                    state=ReservationStateChoice.CONFIRMED,
                    #
                    handled_at=None,
                    confirmed_at=local_datetime(),
                    created_at=local_datetime(),
                    #
                    price=pricing.actions.calculate_reservation_price(duration=end - begin),
                    non_subsidised_price=pricing.highest_price,
                    unit_price=pricing.highest_price,
                    tax_percentage_value=pricing.tax_percentage.value,
                    #
                    applying_for_free_of_charge=False,
                    free_of_charge_reason=None,
                    #
                    purpose=random.choice(reservation_purposes),
                    age_group=age_group,
                    municipality=MunicipalityChoice.HELSINKI,
                    #
                    deny_reason=None,
                    cancel_reason=None,
                )
            )

            reservations.append(reservation)

    if cancel_random > 0:
        cancel_reasons = ReservationCancelReasonChoice.user_selectable

        for reservation in random.sample(reservations, cancel_random):
            reservation.state = ReservationStateChoice.CANCELLED
            reservation.cancel_reason = random.choice(cancel_reasons)
            reservation.cancel_details = "Cancelled"

    if deny_random > 0:
        deny_reasons = list(ReservationDenyReason.objects.all())
        assert deny_reasons, "Reservation deny reasons not found"

        for reservation in random.sample(reservations, deny_random):
            # Reset cancellation.
            reservation.cancel_reason = None
            reservation.cancel_details = ""

            reservation.state = ReservationStateChoice.DENIED
            reservation.deny_reason = random.choice(deny_reasons)
            reservation.handled_at = local_datetime()

    if reject_random > 0:
        rejected_count: int = 0

        while rejected_count <= reject_random:
            # Replace the reservation with a rejected occurrence.
            index = random.randint(0, len(reservations) - 1)
            reservation = reservations.pop(index)
            occurrence = RejectedOccurrenceFactory.build(
                begin_datetime=reservation.begins_at,
                end_datetime=reservation.ends_at,
                reservation_series=reservation.reservation_series,
                created_at=local_datetime(),
            )
            occurrences.append(occurrence)
            rejected_count += 1

    Reservation.objects.bulk_create(reservations)
    RejectedOccurrence.objects.bulk_create(occurrences)
