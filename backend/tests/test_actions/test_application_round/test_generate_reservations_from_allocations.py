from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import freezegun
import pytest

from tilavarauspalvelu.enums import (
    AccessType,
    ApplicantTypeChoice,
    CustomerTypeChoice,
    HaukiResourceState,
    RejectionReadinessChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_api_types import HaukiAPIDatePeriod
from tilavarauspalvelu.models import (
    AffectingTimeSpan,
    RejectedOccurrence,
    Reservation,
    ReservationSeries,
    ReservationUnitHierarchy,
)
from tilavarauspalvelu.typing import Allocation
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, local_time, next_date_matching_weekday

from tests.factories import ReservationFactory, ReservationUnitAccessTypeFactory, UserFactory
from tests.factories.application_round import ApplicationRoundFactory
from tests.factories.reservation_unit import ReservationUnitBuilder
from tests.factories.unit import UnitBuilder

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.patch_method.with_args(HaukiAPIClient.get_date_periods, return_value=[]),
]


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations():
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

    assert HaukiAPIClient.get_date_periods.call_count == 1

    all_series: list[ReservationSeries] = list(ReservationSeries.objects.all())
    assert len(all_series) == 1

    series = all_series[0]
    section = series.allocated_time_slot.reservation_unit_option.application_section

    assert series.name == section.name
    assert series.description == "Seasonal Booking"
    assert series.begin_date == section.reservations_begin_date
    assert series.begin_time == local_time(12, 0).replace(tzinfo=DEFAULT_TIMEZONE)
    assert series.end_date == section.reservations_end_date
    assert series.end_time == local_time(14, 0).replace(tzinfo=DEFAULT_TIMEZONE)
    assert series.recurrence_in_days == 7
    assert series.weekdays == str(Weekday.MONDAY.as_weekday_number)
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
    assert reservations[0].billing_address_street == section.application.billing_street_address
    assert reservations[0].billing_address_city == section.application.billing_city
    assert reservations[0].billing_address_zip == section.application.billing_post_code

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 8, 12)
    assert reservations[1].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 8, 14)

    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 15, 12)
    assert reservations[2].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 15, 14)

    assert RejectedOccurrence.objects.count() == 0


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__individual():
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

    application: Application = application_round.applications.first()
    application.applicant_type = ApplicantTypeChoice.INDIVIDUAL
    application.save()

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())

    assert len(reservations) == 1

    assert reservations[0].description == application.additional_information
    assert reservations[0].reservee_type == CustomerTypeChoice.INDIVIDUAL
    assert reservations[0].reservee_address_street == application.billing_street_address
    assert reservations[0].reservee_address_city == application.billing_city
    assert reservations[0].reservee_address_zip == application.billing_post_code


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__company():
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

    application: Application = application_round.applications.first()
    application.applicant_type = ApplicantTypeChoice.COMPANY
    application.save()

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].description == application.organisation_core_business
    assert reservations[0].reservee_type == CustomerTypeChoice.BUSINESS
    assert reservations[0].reservee_organisation_name == application.organisation_name
    assert reservations[0].reservee_id == application.organisation_identifier
    assert reservations[0].reservee_is_unregistered_association is False
    assert reservations[0].reservee_address_street == application.organisation_street_address
    assert reservations[0].reservee_address_city == application.organisation_city
    assert reservations[0].reservee_address_zip == application.organisation_post_code


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__association():
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

    application: Application = application_round.applications.first()
    application.applicant_type = ApplicantTypeChoice.ASSOCIATION
    application.save()

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].description == application.organisation_core_business
    assert reservations[0].reservee_type == CustomerTypeChoice.NONPROFIT
    assert reservations[0].reservee_organisation_name == application.organisation_name
    assert reservations[0].reservee_id == application.organisation_identifier
    assert reservations[0].reservee_is_unregistered_association is False
    assert reservations[0].reservee_address_street == application.organisation_street_address
    assert reservations[0].reservee_address_city == application.organisation_city
    assert reservations[0].reservee_address_zip == application.organisation_post_code


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__community():
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

    application: Application = application_round.applications.first()
    application.applicant_type = ApplicantTypeChoice.COMMUNITY
    application.save()

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].reservee_type == CustomerTypeChoice.NONPROFIT
    assert reservations[0].reservee_organisation_name == application.organisation_name
    assert reservations[0].reservee_id == application.organisation_identifier
    assert reservations[0].reservee_is_unregistered_association is False
    assert reservations[0].reservee_address_street == application.organisation_street_address
    assert reservations[0].reservee_address_city == application.organisation_city
    assert reservations[0].reservee_address_zip == application.organisation_post_code


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__multiple_allocations():
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

    reservations: list[Reservation] = list(Reservation.objects.all())

    assert len(reservations) == 2

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 2, 12)
    assert reservations[1].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 2, 14)

    assert HaukiAPIClient.get_date_periods.call_count == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__invalid_start_interval():
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
def test_generate_reservation_series_from_allocations__overlapping_reservation():
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

    existing_reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        begins_at=local_datetime(2024, 1, 1, 12, 0),
        ends_at=local_datetime(2024, 1, 1, 14, 0),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

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
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours():
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

    HaukiAPIClient.get_date_periods.return_value = [
        HaukiAPIDatePeriod(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.CLOSED.value,
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

    assert HaukiAPIClient.get_date_periods.call_count == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours__not_affecting():
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

    HaukiAPIClient.get_date_periods.return_value = [
        # Wrong date
        HaukiAPIDatePeriod(
            start_date="2024-01-02",
            end_date="2024-01-02",
            resource_state=HaukiResourceState.CLOSED.value,
            override=True,
        ),
        # Non-overriding date period
        HaukiAPIDatePeriod(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.CLOSED.value,
            override=False,
        ),
        # Not closed
        HaukiAPIDatePeriod(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.WITH_RESERVATION.value,
            override=True,
        ),
    ]

    application_round.actions.generate_reservations_from_allocations()

    reservations: list[Reservation] = list(Reservation.objects.all())
    assert len(reservations) == 1

    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 12)
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(2024, 1, 1, 14)

    assert HaukiAPIClient.get_date_periods.call_count == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))  # Monday
def test_generate_reservation_series_from_allocations__access_code():
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
def test_generate_reservation_series_from_allocations__access_code__changes_during_reservation_period():
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
def test_generate_reservation_series_from_allocations__two_reservation_units_with_different_access_type():
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

    reservations: list[Reservation] = list(qs.filter(reservation_unit=reservation_unit_2))
    assert len(reservations) == 3

    assert reservations[0].access_type == AccessType.ACCESS_CODE
    assert reservations[1].access_type == AccessType.ACCESS_CODE
    assert reservations[2].access_type == AccessType.ACCESS_CODE
