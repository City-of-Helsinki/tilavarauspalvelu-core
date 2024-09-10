import datetime
import re

import freezegun
import pytest

from applications.enums import ApplicantTypeChoice, Weekday
from applications.tasks import generate_reservation_series_from_allocations
from common.date_utils import DEFAULT_TIMEZONE, combine, local_date, local_datetime, local_iso_format
from opening_hours.enums import HaukiResourceState
from opening_hours.utils.hauki_api_client import HaukiAPIClient
from opening_hours.utils.hauki_api_types import HaukiAPIDatePeriod
from reservation_units.models import ReservationUnitHierarchy
from reservations.enums import (
    CustomerTypeChoice,
    RejectionReadinessChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from reservations.models import AffectingTimeSpan, RecurringReservation, RejectedOccurrence, Reservation
from tests.factories import AllocatedTimeSlotFactory, ReservationFactory
from tests.helpers import patch_method
from utils.sentry import SentryLogger

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation(num=3)

    application_round = slot.reservation_unit_option.application_section.application.application_round
    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    assert HaukiAPIClient.get_date_periods.call_count == 1

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1

    assert series[0].name == slot.reservation_unit_option.application_section.name
    assert series[0].description == "Seasonal Booking"
    assert series[0].begin_date == slot.reservation_unit_option.application_section.reservations_begin_date
    assert series[0].begin_time == slot.begin_time
    assert series[0].end_date == slot.reservation_unit_option.application_section.reservations_end_date
    assert series[0].end_time == slot.end_time
    assert series[0].recurrence_in_days == 7
    assert series[0].weekdays == str(Weekday(slot.day_of_the_week).as_weekday_number)
    assert series[0].reservation_unit == slot.reservation_unit_option.reservation_unit
    assert series[0].user == slot.reservation_unit_option.application_section.application.user
    assert series[0].age_group == slot.reservation_unit_option.application_section.age_group
    assert series[0].allocated_time_slot == slot

    reservations: list[Reservation] = list(series[0].reservations.order_by("begin").all())
    assert len(reservations) == 3

    reservation_unit_option = slot.reservation_unit_option
    application_section = reservation_unit_option.application_section
    application = application_section.application
    application_round = application.application_round

    assert reservations[0].name == application_section.name
    assert reservations[0].description == application.additional_information
    assert reservations[0].type == ReservationTypeChoice.SEASONAL.value
    assert reservations[0].state == ReservationStateChoice.CONFIRMED.value
    assert reservations[0].user == application.user
    assert reservations[0].handled_at == application_round.handled_date
    assert reservations[0].num_persons == application_section.num_persons
    assert reservations[0].buffer_time_before == datetime.timedelta(0)
    assert reservations[0].buffer_time_after == datetime.timedelta(0)
    assert reservations[0].reservee_first_name == application.contact_person.first_name
    assert reservations[0].reservee_last_name == application.contact_person.last_name
    assert reservations[0].reservee_email == application.contact_person.email
    assert reservations[0].reservee_phone == application.contact_person.phone_number
    assert reservations[0].billing_address_street == application.billing_address.street_address
    assert reservations[0].billing_address_city == application.billing_address.city
    assert reservations[0].billing_address_zip == application.billing_address.post_code

    assert local_iso_format(reservations[0].begin) == local_datetime(2024, 1, 1, 12).isoformat()
    assert local_iso_format(reservations[0].end) == local_datetime(2024, 1, 1, 14).isoformat()

    assert local_iso_format(reservations[1].begin) == local_datetime(2024, 1, 8, 12).isoformat()
    assert local_iso_format(reservations[1].end) == local_datetime(2024, 1, 8, 14).isoformat()

    assert local_iso_format(reservations[2].begin) == local_datetime(2024, 1, 15, 12).isoformat()
    assert local_iso_format(reservations[2].end) == local_datetime(2024, 1, 15, 14).isoformat()

    assert RejectedOccurrence.objects.count() == 0


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__individual():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation(applicant_type=ApplicantTypeChoice.INDIVIDUAL)

    application_round = slot.reservation_unit_option.application_section.application.application_round
    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1
    assert series[0].allocated_time_slot == slot

    reservations: list[Reservation] = list(series[0].reservations.order_by("begin").all())
    assert len(reservations) == 1

    application = slot.reservation_unit_option.application_section.application

    assert reservations[0].reservee_type == CustomerTypeChoice.INDIVIDUAL
    assert reservations[0].reservee_address_street == application.billing_address.street_address
    assert reservations[0].reservee_address_city == application.billing_address.city
    assert reservations[0].reservee_address_zip == application.billing_address.post_code

    assert HaukiAPIClient.get_date_periods.call_count == 1


@pytest.mark.parametrize(
    "applicant_type",
    [
        ApplicantTypeChoice.COMPANY,
        ApplicantTypeChoice.ASSOCIATION,
        ApplicantTypeChoice.COMMUNITY,
    ],
)
@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__non_individual(applicant_type):
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation(applicant_type=applicant_type)

    application_round = slot.reservation_unit_option.application_section.application.application_round
    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1

    assert series[0].allocated_time_slot == slot

    reservations: list[Reservation] = list(series[0].reservations.order_by("begin").all())
    assert len(reservations) == 1

    application = slot.reservation_unit_option.application_section.application

    assert reservations[0].reservee_type == (
        CustomerTypeChoice.BUSINESS if applicant_type == ApplicantTypeChoice.COMPANY else CustomerTypeChoice.NONPROFIT
    )
    assert reservations[0].reservee_organisation_name == application.organisation.name
    assert reservations[0].reservee_id == application.organisation.identifier
    assert reservations[0].reservee_is_unregistered_association is (application.organisation.identifier is None)
    assert reservations[0].reservee_address_street == application.organisation.address.street_address
    assert reservations[0].reservee_address_city == application.organisation.address.city
    assert reservations[0].reservee_address_zip == application.organisation.address.post_code

    assert HaukiAPIClient.get_date_periods.call_count == 1


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__multiple_allocations():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation()
    application_round = slot.reservation_unit_option.application_section.application.application_round

    AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(16, 0, tzinfo=DEFAULT_TIMEZONE),
        end_time=datetime.time(18, 0, tzinfo=DEFAULT_TIMEZONE),
        reservation_unit_option__reservation_unit=slot.reservation_unit_option.reservation_unit,
        reservation_unit_option__application_section__application__application_round=application_round,
    )

    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 2

    reservations: list[Reservation] = list(series[0].reservations.all())
    assert len(reservations) == 1

    reservations: list[Reservation] = list(series[1].reservations.all())
    assert len(reservations) == 1

    assert HaukiAPIClient.get_date_periods.call_count == 1


@patch_method(HaukiAPIClient.get_date_periods, side_effect=ValueError("Test error"))
@patch_method(SentryLogger.log_exception)
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__error_handling():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation()
    application_round = slot.reservation_unit_option.application_section.application.application_round

    with pytest.raises(ValueError, match=re.escape("Test error")):
        generate_reservation_series_from_allocations(application_round_id=application_round.id)

    # Errors are logged to Sentry.
    assert SentryLogger.log_exception.call_count == 1

    assert HaukiAPIClient.get_date_periods.call_count == 1


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__invalid_start_interval():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation(
        start_time=datetime.time(12, 1, tzinfo=DEFAULT_TIMEZONE),
    )
    application_round = slot.reservation_unit_option.application_section.application.application_round

    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1

    reservations: list[Reservation] = list(series[0].reservations.all())
    assert len(reservations) == 0

    rejected = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.INTERVAL_NOT_ALLOWED
    assert local_iso_format(rejected[0].begin_datetime) == local_datetime(2024, 1, 1, hour=12, minute=1).isoformat()
    assert local_iso_format(rejected[0].end_datetime) == local_datetime(2024, 1, 1, hour=14).isoformat()

    assert HaukiAPIClient.get_date_periods.call_count == 1


NEXT_YEAR = local_date().year + 1


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(NEXT_YEAR, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__overlapping_reservation():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation(num=2)
    application_round = slot.reservation_unit_option.application_section.application.application_round

    ReservationFactory.create_for_reservation_unit(
        reservation_unit=slot.reservation_unit_option.reservation_unit,
        begin=combine(application_round.reservation_period_begin, slot.begin_time),
        end=combine(application_round.reservation_period_begin, slot.end_time),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1

    reservations: list[Reservation] = list(series[0].reservations.all())
    assert len(reservations) == 1

    assert reservations[0].state == ReservationStateChoice.CONFIRMED.value

    rejected = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.OVERLAPPING_RESERVATIONS
    assert local_iso_format(rejected[0].begin_datetime) == local_datetime(NEXT_YEAR, 1, 1, hour=12).isoformat()
    assert local_iso_format(rejected[0].end_datetime) == local_datetime(NEXT_YEAR, 1, 1, hour=14).isoformat()

    assert HaukiAPIClient.get_date_periods.call_count == 1


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation()
    application_round = slot.reservation_unit_option.application_section.application.application_round

    HaukiAPIClient.get_date_periods.return_value = [
        HaukiAPIDatePeriod(
            start_date="2024-01-01",
            end_date="2024-01-01",
            resource_state=HaukiResourceState.CLOSED.value,
            override=True,
        ),
    ]

    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1

    reservations: list[Reservation] = list(series[0].reservations.all())
    assert len(reservations) == 0

    rejected = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 1

    assert rejected[0].rejection_reason == RejectionReadinessChoice.RESERVATION_UNIT_CLOSED
    assert local_iso_format(rejected[0].begin_datetime) == local_datetime(2024, 1, 1, hour=12).isoformat()
    assert local_iso_format(rejected[0].end_datetime) == local_datetime(2024, 1, 1, hour=14).isoformat()

    assert HaukiAPIClient.get_date_periods.call_count == 1


@patch_method(HaukiAPIClient.get_date_periods, return_value=[])
@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE))
def test_generate_reservation_series_from_allocations__explicitly_closed_opening_hours__not_affecting():
    slot = AllocatedTimeSlotFactory.create_ready_for_reservation()
    application_round = slot.reservation_unit_option.application_section.application.application_round

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

    generate_reservation_series_from_allocations(application_round_id=application_round.id)

    series: list[RecurringReservation] = list(RecurringReservation.objects.all())
    assert len(series) == 1

    reservations: list[Reservation] = list(series[0].reservations.all())
    assert len(reservations) == 1

    rejected = list(RejectedOccurrence.objects.all())
    assert len(rejected) == 0

    assert HaukiAPIClient.get_date_periods.call_count == 1
