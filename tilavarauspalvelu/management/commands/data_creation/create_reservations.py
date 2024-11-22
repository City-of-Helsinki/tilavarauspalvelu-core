import datetime
import random

from django.db import models

from tests.factories import RecurringReservationFactory, RejectedOccurrenceFactory
from tests.factories.payment_order import PaymentOrderBuilder
from tests.factories.reservation import NextDateError, ReservationBuilder
from tilavarauspalvelu.enums import (
    CustomerTypeChoice,
    Language,
    OrderStatus,
    PaymentType,
    ReservationKind,
    ReservationStateChoice,
    ReservationTypeChoice,
    TermsOfUseTypeChoices,
    WeekdayChoice,
)
from tilavarauspalvelu.models import (
    AgeGroup,
    City,
    OriginHaukiResource,
    PaymentOrder,
    RecurringReservation,
    RejectedOccurrence,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPricing,
    TaxPercentage,
    TermsOfUse,
    User,
)
from utils.date_utils import DEFAULT_TIMEZONE, combine, get_date_range, get_periods_between, local_date, local_datetime

from .create_reservation_related_things import _create_cancel_reasons, _create_deny_reasons
from .create_reservation_units import _create_reservation_unit_for_recurring_reservations
from .utils import SetName, weighted_choice, with_logs


@with_logs
def _create_reservations(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
) -> None:
    # --- Create dependencies for the reservations  -----------------------------------------------------------------

    cancel_reasons = _create_cancel_reasons()
    deny_reasons = _create_deny_reasons()

    # --- Create reservations  --------------------------------------------------------------------------------------

    _create_normal_reservations(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
        cancel_reasons=cancel_reasons,
        deny_reasons=deny_reasons,
    )

    _create_full_day_reservations(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
    )

    _create_reservations_for_reservation_units_affecting_other_reservation_units(
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
    )


@with_logs
def _create_normal_reservations(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    cancel_reasons: list[ReservationCancelReason],
    deny_reasons: list[ReservationDenyReason],
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
            "payment_types",
        )
        .order_by("pk")
    )

    user = User.objects.get(username="tvp")

    reservation_type_choices: list[ReservationTypeChoice] = [
        ReservationTypeChoice.NORMAL,
        ReservationTypeChoice.BEHALF,
        ReservationTypeChoice.STAFF,
    ]

    customer_type_choices: list[CustomerTypeChoice] = [
        CustomerTypeChoice.INDIVIDUAL,
        CustomerTypeChoice.BUSINESS,
        CustomerTypeChoice.NONPROFIT,
    ]

    handling_state_choices: list[ReservationStateChoice] = [
        ReservationStateChoice.REQUIRES_HANDLING,
        ReservationStateChoice.CONFIRMED,
        ReservationStateChoice.DENIED,
    ]

    ReservationUnitThroughModel: type[models.Model] = Reservation.reservation_units.through  # noqa: N806

    reservations: list[Reservation] = []
    reservation_reservation_units: list[models.Model] = []
    payment_orders: list[PaymentOrder] = []

    # --- Create reservations -------------------------------------------------------------------------------------

    start_date = local_date()

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

        payment_types_choices: list[PaymentType] = [
            PaymentType(payment_type.code) for payment_type in reservation_unit.payment_types.all()
        ]

        reservation_state: ReservationStateChoice = ReservationStateChoice.CONFIRMED
        handled_at: datetime.datetime | None = None
        applying_for_free_of_charge: bool = False
        free_of_charge_reason: str | None = None
        deny_reason: ReservationDenyReason | None = None

        if reservation_unit.require_reservation_handling:
            reservation_state = weighted_choice(handling_state_choices, weights=[2, 5, 1])
            if reservation_state in {ReservationStateChoice.CONFIRMED, ReservationStateChoice.DENIED}:
                handled_at = local_datetime()

        for reservation_date in get_date_range(start_date, number=14):
            begin_time = datetime.time(hour=random.randint(6, 10), tzinfo=DEFAULT_TIMEZONE)
            begin_datetime = combine(reservation_date, begin_time)

            while reservation_date == begin_datetime.date():
                customer_type = weighted_choice(customer_type_choices, weights=[5, 1, 1])
                reservation_type = weighted_choice(reservation_type_choices, weights=[5, 1, 1])

                if reservation_state in handling_state_choices and pricing.highest_price != pricing.lowest_price:
                    applying_for_free_of_charge = random.choice([True, False])
                    if applying_for_free_of_charge:
                        free_of_charge_reason = "Reason for applying for free of charge"

                if reservation_state == ReservationStateChoice.DENIED:
                    deny_reason = random.choice(deny_reasons)

                try:
                    reservation = (
                        ReservationBuilder()
                        .for_user(user)
                        .for_reservation_unit(reservation_unit)
                        .for_customer_type(customer_type)
                        .starting_at(begin_datetime, reservation_unit, pricing=pricing)
                        .build(
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
                            home_city=random.choice(cities),
                            #
                            deny_reason=deny_reason,
                            cancel_reason=None,
                        )
                    )

                # Reservation doesn't fit on this date, go to next date.
                except NextDateError:
                    break

                reservations.append(reservation)

                reservation_reservation_units.append(
                    ReservationUnitThroughModel(
                        reservation=reservation,
                        reservationunit=reservation_unit,
                    )
                )

                if pricing.highest_price > 0:
                    payment_order = _build_payment_order(reservation, payment_types_choices)
                    payment_orders.append(payment_order)

                begin_datetime += datetime.timedelta(hours=random.randint(min_interval_hours, max_interval_hours))

    # Cancel 10 random reservations
    for reservation in random.sample(reservation_units, 10):
        reservation.state = ReservationStateChoice.CANCELLED
        reservation.cancel_details = "Cancelled"
        reservation.cancel_reason = random.choice(cancel_reasons)
        # TODO: Doesn't cancel payment orders if present. Can't fetch them since they are not in the database yet.

    ReservationUnit.objects.bulk_update(reservation_units, fields=["name", "name_fi", "name_en", "name_sv"])
    Reservation.objects.bulk_create(reservations)
    ReservationUnitThroughModel.objects.bulk_create(reservation_reservation_units)
    PaymentOrder.objects.bulk_create(payment_orders)


def _build_payment_order(reservation: Reservation, payment_types_choices: list[PaymentType]) -> PaymentOrder:
    payment_order_builder = PaymentOrderBuilder().set(
        language=reservation.reservee_language or Language.FI,
        price_net=reservation.price_net,
        price_vat=reservation.price_vat_amount,
        price_total=reservation.price,
        reservation=reservation,
        reservation_user_uuid=reservation.user.uuid,
    )

    if len(payment_types_choices) == 1:
        payment_type = payment_types_choices[0]
    elif set(payment_types_choices) == {PaymentType.INVOICE, PaymentType.ON_SITE}:
        payment_type = PaymentType.INVOICE
    else:
        payment_type = PaymentType.ONLINE

    if payment_type == PaymentType.ON_SITE:
        return payment_order_builder.build(
            payment_type=payment_type,
            status=OrderStatus.PAID_MANUALLY,
        )

    return payment_order_builder.for_mock_order(reservation).build(
        payment_type=payment_type,
        status=OrderStatus.PAID,
    )


@with_logs
def _create_full_day_reservations(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
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

    customer_type_choices: list[CustomerTypeChoice] = [
        CustomerTypeChoice.INDIVIDUAL,
        CustomerTypeChoice.BUSINESS,
        CustomerTypeChoice.NONPROFIT,
    ]

    reservation_type_choices: list[ReservationTypeChoice] = [
        ReservationTypeChoice.NORMAL,
        ReservationTypeChoice.BEHALF,
        ReservationTypeChoice.STAFF,
    ]

    ReservationUnitThroughModel: type[models.Model] = Reservation.reservation_units.through  # noqa: N806

    reservations: list[Reservation] = []
    reservation_reservation_units: list[models.Model] = []

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

            customer_type = weighted_choice(customer_type_choices, weights=[5, 1, 1])
            reservation_type = weighted_choice(reservation_type_choices, weights=[5, 1, 1])

            reservation = (
                ReservationBuilder()
                .for_user(user)
                .for_reservation_unit(reservation_unit)
                .for_customer_type(customer_type)
                .starting_at(begin_datetime, reservation_unit, pricing=pricing)
                .build(
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
                    home_city=random.choice(cities),
                )
            )
            reservations.append(reservation)

            reservation_reservation_units.append(
                ReservationUnitThroughModel(
                    reservation=reservation,
                    reservationunit=reservation_unit,
                )
            )

    Reservation.objects.bulk_create(reservations)
    ReservationUnitThroughModel.objects.bulk_create(reservation_reservation_units)


@with_logs
def _create_reservations_for_reservation_units_affecting_other_reservation_units(
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
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

    customer_type_choices: list[CustomerTypeChoice] = [
        CustomerTypeChoice.INDIVIDUAL,
        CustomerTypeChoice.BUSINESS,
        CustomerTypeChoice.NONPROFIT,
    ]

    ReservationUnitThroughModel: type[models.Model] = Reservation.reservation_units.through  # noqa: N806

    reservations: list[Reservation] = []
    reservation_reservation_units: list[models.Model] = []

    # --- Create reservations -------------------------------------------------------------------------------------

    reservation_date = local_date()

    for reservation_unit in space_reservation_units:
        pricing: ReservationUnitPricing = next(iter(reservation_unit.pricings.all()), None)
        assert pricing is not None, "Reservation unit must have at least one pricing"

        begin_time = datetime.time(hour=random.randint(8, 12), tzinfo=DEFAULT_TIMEZONE)
        begin_datetime = combine(reservation_date, begin_time)

        customer_type = weighted_choice(customer_type_choices, weights=[5, 1, 1])

        reservation = (
            ReservationBuilder()
            .for_user(user)
            .for_reservation_unit(reservation_unit)
            .for_customer_type(customer_type)
            .starting_at(begin_datetime, reservation_unit, pricing=pricing)
            .build(
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
                home_city=random.choice(cities),
            )
        )
        reservations.append(reservation)

        reservation_reservation_units.append(
            ReservationUnitThroughModel(
                reservation=reservation,
                reservationunit=reservation_unit,
            )
        )

        # Only one reservation per day, so that we don't accidentally create overlapping reservations
        reservation_date += datetime.timedelta(days=1)

    for reservation_unit in resource_reservation_units:
        pricing: ReservationUnitPricing = next(iter(reservation_unit.pricings.all()), None)
        assert pricing is not None, "Reservation unit must have at least one pricing"

        begin_time = datetime.time(hour=random.randint(8, 12), tzinfo=DEFAULT_TIMEZONE)
        begin_datetime = combine(reservation_date, begin_time)

        customer_type = weighted_choice(customer_type_choices, weights=[5, 1, 1])

        reservation = (
            ReservationBuilder()
            .for_user(user)
            .for_reservation_unit(reservation_unit)
            .for_customer_type(customer_type)
            .starting_at(begin_datetime, reservation_unit, pricing=pricing)
            .build(
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
                home_city=random.choice(cities),
            )
        )
        reservations.append(reservation)

        reservation_reservation_units.append(
            ReservationUnitThroughModel(
                reservation=reservation,
                reservationunit=reservation_unit,
            )
        )

        # Only one reservation per day, so that we don't accidentally create overlapping reservations
        reservation_date += datetime.timedelta(days=1)

    Reservation.objects.bulk_create(reservations)
    ReservationUnitThroughModel.objects.bulk_create(reservation_reservation_units)


@with_logs
def _create_recurring_reservations(
    metadata_sets: dict[SetName, ReservationMetadataSet],
    terms_of_use: dict[TermsOfUseTypeChoices, TermsOfUse],
    cancellation_rules: list[ReservationUnitCancellationRule],
    hauki_resources: list[OriginHaukiResource],
    tax_percentage: TaxPercentage,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
) -> None:
    user = User.objects.get(username="tvp")

    reservation_unit = _create_reservation_unit_for_recurring_reservations(
        metadata_sets=metadata_sets,
        terms_of_use=terms_of_use,
        cancellation_rules=cancellation_rules,
        hauki_resources=hauki_resources,
        tax_percentage=tax_percentage,
    )

    _create_past_recurring_reservation(
        name="Viime kauden futistreenit",
        weekdays=[WeekdayChoice.MONDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
    )

    _create_future_recurring_reservation(
        name="Tulevan kauden futistreenit",
        weekdays=[WeekdayChoice.MONDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
    )

    _create_ongoing_recurring_reservation(
        name="Aikuisten treenit kaksi kertaa viikossa",
        weekdays=[WeekdayChoice.WEDNESDAY, WeekdayChoice.FRIDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
    )

    _create_ongoing_recurring_reservation(
        name="Ajoittaiset viikonloppupelit",
        weekdays=[WeekdayChoice.SATURDAY],
        reservation_unit=reservation_unit,
        user=user,
        reservation_purposes=reservation_purposes,
        age_groups=age_groups,
        cities=cities,
        cancel_random=3,
        deny_random=3,
        reject_random=3,
    )


@with_logs
def _create_past_recurring_reservation(
    name: str,
    weekdays: list[WeekdayChoice],
    reservation_unit: ReservationUnit,
    user: User,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    today = local_date()

    age_group = random.choice(age_groups)
    series = RecurringReservationFactory.create(
        name=name,
        #
        begin_date=today - datetime.timedelta(days=90),
        end_date=today - datetime.timedelta(days=1),
        #
        end_time=datetime.time(hour=11, minute=0),
        begin_time=datetime.time(hour=9, minute=0),
        #
        weekdays=",".join(str(day.value) for day in weekdays),
        reservation_unit=reservation_unit,
        user=user,
        age_group=age_group,
    )
    _create_reservations_for_series(
        series=series,
        reservation_purposes=reservation_purposes,
        age_group=age_group,
        cities=cities,
        cancel_random=cancel_random,
        deny_random=deny_random,
        reject_random=reject_random,
    )


@with_logs
def _create_future_recurring_reservation(
    name: str,
    weekdays: list[WeekdayChoice],
    reservation_unit: ReservationUnit,
    user: User,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    today = local_date()

    age_group = random.choice(age_groups)
    series = RecurringReservationFactory.create(
        name=name,
        #
        begin_date=today + datetime.timedelta(days=1),
        end_date=today + datetime.timedelta(days=90),
        #
        begin_time=datetime.time(hour=8, minute=0),
        end_time=datetime.time(hour=10, minute=0),
        #
        weekdays=",".join(str(day.value) for day in weekdays),
        reservation_unit=reservation_unit,
        user=user,
        age_group=age_group,
    )
    _create_reservations_for_series(
        series=series,
        reservation_purposes=reservation_purposes,
        age_group=age_group,
        cities=cities,
        cancel_random=cancel_random,
        deny_random=deny_random,
        reject_random=reject_random,
    )


@with_logs
def _create_ongoing_recurring_reservation(
    name: str,
    weekdays: list[WeekdayChoice],
    reservation_unit: ReservationUnit,
    user: User,
    reservation_purposes: list[ReservationPurpose],
    age_groups: list[AgeGroup],
    cities: list[City],
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    today = local_date()

    age_group = random.choice(age_groups)
    series = RecurringReservationFactory.create(
        name=name,
        #
        begin_date=today - datetime.timedelta(days=30),
        end_date=today + datetime.timedelta(days=60),
        #
        begin_time=datetime.time(hour=14, minute=0),
        end_time=datetime.time(hour=16, minute=0),
        #
        weekdays=",".join(str(day.value) for day in weekdays),
        reservation_unit=reservation_unit,
        user=user,
        age_group=age_group,
    )
    _create_reservations_for_series(
        series=series,
        reservation_purposes=reservation_purposes,
        age_group=age_group,
        cities=cities,
        cancel_random=cancel_random,
        deny_random=deny_random,
        reject_random=reject_random,
    )


def _create_reservations_for_series(
    series: RecurringReservation,
    reservation_purposes: list[ReservationPurpose],
    cities: list[City],
    age_group: AgeGroup,
    *,
    cancel_random: int = 0,
    deny_random: int = 0,
    reject_random: int = 0,
) -> None:
    ReservationUnitThroughModel: type[models.Model] = Reservation.reservation_units.through  # noqa: N806

    pricing: ReservationUnitPricing | None = series.reservation_unit.pricings.active().first()
    assert pricing is not None, "Reservation unit must have at least one pricing"

    weekdays: list[int] = [int(val) for val in series.weekdays.split(",") if val]

    reservations: list[Reservation] = []
    reservation_reservation_units: list[models.Model] = []
    occurrences: list[RejectedOccurrence] = []

    for weekday in weekdays:
        delta: int = weekday - series.begin_date.weekday()
        if delta < 0:
            delta += 7

        begin_date = series.begin_date + datetime.timedelta(days=delta)

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
                    recurring_reservation=series,
                    #
                    begin=begin,
                    end=end,
                    buffer_time_before=buffer_time_before,
                    buffer_time_after=buffer_time_after,
                    #
                    type=ReservationTypeChoice.NORMAL,
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
                    home_city=random.choice(cities),
                    #
                    deny_reason=None,
                    cancel_reason=None,
                )
            )

            reservations.append(reservation)

            reservation_reservation_units.append(
                ReservationUnitThroughModel(
                    reservation=reservation,
                    reservationunit=series.reservation_unit,
                )
            )

    if cancel_random > 0:
        cancel_reasons = list(ReservationCancelReason.objects.all())
        assert cancel_reasons, "Reservation cancel reasons not found"

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
            reservation_reservation_units.pop(index)
            occurrence = RejectedOccurrenceFactory.build(
                begin_datetime=reservation.begin,
                end_datetime=reservation.end,
                recurring_reservation=reservation.recurring_reservation,
                created_at=local_datetime(),
            )
            occurrences.append(occurrence)
            rejected_count += 1

    Reservation.objects.bulk_create(reservations)
    ReservationUnitThroughModel.objects.bulk_create(reservation_reservation_units)
    RejectedOccurrence.objects.bulk_create(occurrences)
