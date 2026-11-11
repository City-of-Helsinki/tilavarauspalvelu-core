from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import freezegun
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from tilavarauspalvelu.enums import (
    AccessType,
    HaukiResourceState,
    PriceUnit,
    RejectionReadinessChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
    Weekday,
)
from tilavarauspalvelu.exceptions import ApplicationRoundPricingGroupsMixedError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIDatePeriod
from tilavarauspalvelu.models import (
    ApplicationSection,
    RejectedOccurrence,
    Reservation,
    ReservationPriceLine,
    ReservationSeries,
    ReservationStatistic,
    ReservationUnitHierarchy,
)
from tilavarauspalvelu.typing import Allocation
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, local_time, next_date_matching_weekday

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationFactory,
    ReservationUnitAccessTypeFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.factories.application_round import ApplicationRoundFactory
from tests.factories.reservation_unit import ReservationUnitBuilder
from tests.factories.unit import UnitBuilder
from tests.helpers import as_mock

if TYPE_CHECKING:
    from pytest_django import DjangoCaptureOnCommitCallbacks, Settings

    from tilavarauspalvelu.models import Application, ApplicationRound, PriceOption, ReservationUnit

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.patch_method.with_args(HaukiAPIClient.get_date_periods, return_value=[]),
]


def closed_date_period(
    *,
    start_date: str | None,
    end_date: str | None,
    resource_state: HaukiResourceState,
    override: bool,
) -> HaukiAPIDatePeriod:
    """Return a Hauki date period. The reservation generation reads only the dates, the state and the override."""
    return HaukiAPIDatePeriod(
        id=1,
        resource=1,
        name={"fi": None, "sv": None, "en": None},
        description={"fi": None, "sv": None, "en": None},
        start_date=start_date,
        end_date=end_date,
        resource_state=resource_state,
        override=override,
        origins=[],
        created="2023-09-06T09:14:12.671531+03:00",
        modified="2023-09-06T09:14:12.671531+03:00",
        time_span_groups=[],
    )


# ── Helpers ──


JAN_1_2024 = datetime.date(2024, 1, 1)
JAN_8_2024 = datetime.date(2024, 1, 8)


def create_round_on_mondays(*, reservation_units: list[ReservationUnit], weeks: int = 3) -> ApplicationRound:
    """A handled round with an allocation on Mondays 12-14 for each reservation unit, from January 1st 2024."""
    return ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            )
            for reservation_unit in reservation_units
        ],
        reservation_period_begin_date=JAN_1_2024,
        reservation_period_end_date=JAN_1_2024 + datetime.timedelta(weeks=weeks - 1),
        user=UserFactory.create(),
    )


def create_priced_reservation_unit(*, price_option: PriceOption | None = None) -> ReservationUnit:
    unit_group = price_option.unit_group if price_option is not None else None
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        price_option=price_option,
        valid_from=JAN_1_2024,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )
    reservation_unit = ReservationUnitBuilder().with_unrestricted_access().create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1_2024,
    )
    return reservation_unit


# ── Reservation series ──


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=14),
        user=user,
    )

    application_round.actions.generate_reservations_from_allocations()

    assert as_mock(HaukiAPIClient.get_date_periods).call_count == 1

    all_series: list[ReservationSeries] = list(ReservationSeries.objects.all())
    assert len(all_series) == 1

    series = all_series[0]
    assert series.allocated_time_slot is not None
    section = series.allocated_time_slot.reservation_unit_option.application_section

    assert series.name == section.name
    assert series.description == "Seasonal Booking"
    assert series.begin_date == section.reservations_begin_date
    assert series.begin_time == local_time(12, 0).replace(tzinfo=DEFAULT_TIMEZONE)
    assert series.end_date == section.reservations_end_date
    assert series.end_time == local_time(14, 0).replace(tzinfo=DEFAULT_TIMEZONE)
    assert series.recurrence_in_days == 7
    assert series.weekdays == [Weekday.MONDAY]
    assert series.reservation_unit == reservation_unit
    assert series.user == user
    assert series.age_group == section.age_group

    reservations: list[Reservation] = list(series.reservations.order_by("begins_at").all())

    assert len(reservations) == 3

    assert reservations[0].name == section.name
    assert reservations[0].type == ReservationTypeChoice.SEASONAL.value
    assert reservations[0].state == ReservationStateChoice.CONFIRMED.value
    assert reservations[0].user == section.application.user
    assert reservations[0].handled_at == application_round.handled_at
    assert reservations[0].num_persons == section.num_persons
    assert reservations[0].buffer_time_before == datetime.timedelta(0)
    assert reservations[0].buffer_time_after == datetime.timedelta(0)
    assert reservations[0].reservee_first_name == section.application.contact_person_first_name
    assert reservations[0].reservee_last_name == section.application.contact_person_last_name
    assert reservations[0].reservee_email == section.application.contact_person_email
    assert reservations[0].reservee_phone == section.application.contact_person_phone_number

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 8, 12)
    assert reservations[1].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 8, 14)

    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 15, 12)
    assert reservations[2].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 15, 14)

    assert RejectedOccurrence.objects.count() == 0


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__creates_statistics(
    settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    settings.SAVE_RESERVATION_STATISTICS = True

    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=14),
        user=user,
    )

    with django_capture_on_commit_callbacks(execute=True):
        application_round.actions.generate_reservations_from_allocations()

    reservation_pks = set(Reservation.objects.values_list("pk", flat=True))
    statistic_reservation_pks = set(ReservationStatistic.objects.values_list("reservation", flat=True))

    assert len(reservation_pks) == 3
    assert statistic_reservation_pks == reservation_pks


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__individual() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    application: Application = application_round.applications.get()
    application.applicant_type = ReserveeType.INDIVIDUAL
    application.save()

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())

    assert len(reservations) == 1

    assert reservations[0].description == application.additional_information
    assert reservations[0].reservee_type == ReserveeType.INDIVIDUAL


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
@pytest.mark.parametrize("reservee_type", [ReserveeType.COMPANY, ReserveeType.NONPROFIT])
def test_generate_reservation_series_from_allocations__organisation_reservee(reservee_type: ReserveeType) -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    application: Application = application_round.applications.get()
    application.applicant_type = reservee_type
    application.save()

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].description == application.organisation_core_business
    assert reservations[0].reservee_type == reservee_type
    assert reservations[0].reservee_organisation_name == application.organisation_name
    assert reservations[0].reservee_identifier == application.organisation_identifier
    assert reservations[0].reservee_address_zip == application.organisation_post_code


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__multiple_allocations() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.TUESDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.order_by("begins_at"))

    assert len(reservations) == 2

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 2, 12)
    assert reservations[1].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 2, 14)

    assert as_mock(HaukiAPIClient.get_date_periods).call_count == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__invalid_start_interval() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 1),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 0

    rejected: list[RejectedOccurrence] = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.INTERVAL_NOT_ALLOWED
    assert rejected[0].begin_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, hour=12, minute=1)
    assert rejected[0].end_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, hour=14)


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__overlapping_reservation() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    ReservationUnitHierarchy.refresh()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    existing_reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 1, 12, 0),
        ends_at=local_datetime(2024, 1, 1, 14, 0),
    )

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0] == existing_reservation
    assert reservations[0].reservation_series is None

    rejected: list[RejectedOccurrence] = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.OVERLAPPING_RESERVATIONS
    assert rejected[0].begin_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12, 0)
    assert rejected[0].end_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14, 0)


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    as_mock(HaukiAPIClient.get_date_periods).return_value = [
        closed_date_period(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.CLOSED,
            override=True,
        ),
    ]

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 0

    rejected: list[RejectedOccurrence] = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.RESERVATION_UNIT_CLOSED
    assert rejected[0].begin_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert rejected[0].end_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert as_mock(HaukiAPIClient.get_date_periods).call_count == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours__no_end_date() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=7),
        user=user,
    )

    as_mock(HaukiAPIClient.get_date_periods).return_value = [
        closed_date_period(
            start_date="2024-01-08",
            end_date=None,
            resource_state=HaukiResourceState.CLOSED,
            override=True,
        ),
    ]

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)

    rejected: list[RejectedOccurrence] = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.RESERVATION_UNIT_CLOSED
    assert rejected[0].begin_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 8, 12)


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours__no_start_date() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=7),
        user=user,
    )

    as_mock(HaukiAPIClient.get_date_periods).return_value = [
        closed_date_period(
            start_date=None,
            end_date="2024-01-01",
            resource_state=HaukiResourceState.CLOSED,
            override=True,
        ),
    ]

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 8, 12)

    rejected: list[RejectedOccurrence] = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.RESERVATION_UNIT_CLOSED
    assert rejected[0].begin_datetime.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours__not_affecting() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    as_mock(HaukiAPIClient.get_date_periods).return_value = [
        # Wrong date
        closed_date_period(
            start_date="2024-01-02",
            end_date="2024-01-02",
            resource_state=HaukiResourceState.CLOSED,
            override=True,
        ),
        # Non-overriding date period
        closed_date_period(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.CLOSED,
            override=False,
        ),
        # Not closed
        closed_date_period(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.WITH_RESERVATION,
            override=True,
        ),
    ]

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert as_mock(HaukiAPIClient.get_date_periods).call_count == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__access_code() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_access_code().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=1),
        user=user,
    )

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].access_type == AccessType.ACCESS_CODE


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__access_code__changes_during_reservation_period() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit = ReservationUnitBuilder().for_unit(unit).with_free_pricing().create()

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=local_date(2024, 1, 1),
        access_type=AccessType.UNRESTRICTED,
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        begin_date=local_date(2024, 1, 8),
        access_type=AccessType.ACCESS_CODE,
    )

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=14),
        user=user,
    )

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 3

    assert reservations[0].access_type == AccessType.UNRESTRICTED
    assert reservations[1].access_type == AccessType.ACCESS_CODE
    assert reservations[2].access_type == AccessType.ACCESS_CODE


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__two_reservation_units_with_different_access_type() -> None:
    user = UserFactory.create()
    unit = UnitBuilder().with_hauki_resource().create()
    reservation_unit_1 = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_unrestricted_access().create()
    reservation_unit_2 = ReservationUnitBuilder().for_unit(unit).with_free_pricing().with_access_code().create()

    next_monday = next_date_matching_weekday(local_date(), Weekday.MONDAY)

    application_round = ApplicationRoundFactory.create_with_allocations(
        allocations=[
            Allocation(
                reservation_unit=reservation_unit_1,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
            Allocation(
                reservation_unit=reservation_unit_2,
                day_of_the_week=Weekday.MONDAY,
                begin_time=local_time(12, 0),
                end_time=local_time(14, 0),
            ),
        ],
        reservation_period_begin_date=next_monday,
        reservation_period_end_date=next_monday + datetime.timedelta(days=14),
        user=user,
    )

    application_round.actions.generate_reservations_from_allocations()

    qs = Reservation.objects.order_by("begins_at")

    reservations: list[Reservation] = list(qs.filter(reservation_unit=reservation_unit_1))
    assert len(reservations) == 3

    assert reservations[0].access_type == AccessType.UNRESTRICTED
    assert reservations[1].access_type == AccessType.UNRESTRICTED
    assert reservations[2].access_type == AccessType.UNRESTRICTED

    reservations = list(qs.filter(reservation_unit=reservation_unit_2))
    assert len(reservations) == 3

    assert reservations[0].access_type == AccessType.ACCESS_CODE
    assert reservations[1].access_type == AccessType.ACCESS_CODE
    assert reservations[2].access_type == AccessType.ACCESS_CODE


# ── Prices ──


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_generate_reservation_series_from_allocations__prices_from_price_option() -> None:
    adults = PriceOptionFactory.create(unit_group=UnitGroupFactory.create(), name="Aikuiset")
    reservation_unit = create_priced_reservation_unit(price_option=adults)
    application_round = create_round_on_mondays(reservation_units=[reservation_unit])
    ApplicationSection.objects.update(price_option=adults)

    application_round.actions.generate_reservations_from_allocations()

    reservations = list(Reservation.objects.order_by("begins_at"))
    assert len(reservations) == 3
    for reservation in reservations:
        assert reservation.price_option == adults
        assert reservation.total_price == Decimal("20.00")
        assert reservation.total_price_without_overrides == Decimal("20.00")

        lines = list(reservation.price_lines.all())
        assert len(lines) == 1
        assert lines[0].description_fi == "Aikuiset"
        assert lines[0].quantity == Decimal(2)
        assert lines[0].amount == Decimal("20.00")


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_generate_reservation_series_from_allocations__component_with_and_without_price_option() -> None:
    adults = PriceOptionFactory.create(unit_group=UnitGroupFactory.create(), name="Aikuiset")
    pricing_group = PricingGroupFactory.create(unit_group=adults.unit_group)
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        price_option=None,
        valid_from=JAN_1_2024,
        valid_until=JAN_8_2024,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        price_option=adults,
        valid_from=JAN_8_2024,
        amount=Decimal(15),
        price_unit=PriceUnit.PER_HOUR,
    )
    reservation_unit = ReservationUnitBuilder().with_unrestricted_access().create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1_2024,
    )
    application_round = create_round_on_mondays(reservation_units=[reservation_unit], weeks=2)
    ApplicationSection.objects.update(price_option=adults)

    application_round.actions.generate_reservations_from_allocations()

    reservations = list(Reservation.objects.order_by("begins_at"))
    assert [reservation.total_price for reservation in reservations] == [Decimal("20.00"), Decimal("30.00")]
    assert [reservation.price_lines.get().description_fi for reservation in reservations] == ["", "Aikuiset"]


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_generate_reservation_series_from_allocations__pricing_group_changes_during_reservation_period() -> None:
    reservation_unit = create_priced_reservation_unit()
    second_group = PricingGroupFactory.create()
    PriceComponentFactory.create(
        pricing_group=second_group,
        valid_from=JAN_8_2024,
        amount=Decimal(30),
        price_unit=PriceUnit.PER_HOUR,
    )
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=second_group,
        begins=JAN_8_2024,
    )
    application_round = create_round_on_mondays(reservation_units=[reservation_unit])

    application_round.actions.generate_reservations_from_allocations()

    reservations = list(Reservation.objects.order_by("begins_at"))
    assert [reservation.total_price for reservation in reservations] == [
        Decimal("20.00"),
        Decimal("60.00"),
        Decimal("60.00"),
    ]
    assert all(reservation.price_option is None for reservation in reservations)


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_generate_reservation_series_from_allocations__no_pricing_groups() -> None:
    adults = PriceOptionFactory.create(unit_group=UnitGroupFactory.create())
    reservation_unit = ReservationUnitBuilder().with_unrestricted_access().create()
    application_round = create_round_on_mondays(reservation_units=[reservation_unit])
    ApplicationSection.objects.update(price_option=adults)

    application_round.actions.generate_reservations_from_allocations()

    reservations = list(Reservation.objects.order_by("begins_at"))
    assert len(reservations) == 3
    for reservation in reservations:
        assert reservation.total_price == Decimal(0)
        assert reservation.price_option is None
    assert ReservationPriceLine.objects.count() == 0


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_generate_reservation_series_from_allocations__mixed_pricing_groups() -> None:
    priced_unit = create_priced_reservation_unit()
    unpriced_unit = ReservationUnitBuilder().with_unrestricted_access().create()
    application_round = create_round_on_mondays(reservation_units=[priced_unit, unpriced_unit])

    with pytest.raises(ApplicationRoundPricingGroupsMixedError):
        application_round.actions.generate_reservations_from_allocations()

    assert ReservationSeries.objects.count() == 0
    assert Reservation.objects.count() == 0


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_generate_reservation_series_from_allocations__price_query_count_does_not_grow_with_reservations() -> None:
    def count_queries(weeks: int) -> int:
        reservation_unit = create_priced_reservation_unit()
        application_round = create_round_on_mondays(reservation_units=[reservation_unit], weeks=weeks)
        with CaptureQueriesContext(connection) as context:
            application_round.actions.generate_reservations_from_allocations()
        return len(context.captured_queries)

    assert count_queries(weeks=2) == count_queries(weeks=6)
