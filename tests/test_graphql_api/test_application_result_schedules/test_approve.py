import datetime
from unittest.mock import patch

import pytest
from freezegun import freeze_time

from applications.choices import ApplicationEventStatusChoice
from applications.models import ApplicationEvent, ApplicationEventSchedule
from reservations.choices import ReservationStateChoice
from reservations.models import RecurringReservation, Reservation
from tests.factories import ApplicationEventFactory, ApplicationFactory, ReservationUnitFactory
from tests.helpers import UserType

from .helpers import APPROVE_MUTATION, mock_empty_opening_hours, mock_full_opening_hours

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

# Just some monday that avoids daylight savings time issues
SOME_MONDAY = datetime.datetime(2023, 9, 25)


@freeze_time(SOME_MONDAY)
def test_approve_application_event_schedule__reservations_successful(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is approved
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - Allocation data has been set on the application event schedule
    # - A recurring reservation has been created for the application event
    # - Reservations have been created for the recurring reservation
    # - The application event status has changed to RESERVED
    assert response.has_errors is False, response

    schedule.refresh_from_db()
    assert schedule.allocated_day == schedule.day
    assert schedule.allocated_begin == schedule.begin
    assert schedule.allocated_end == schedule.end
    assert schedule.allocated_reservation_unit == reservation_unit

    event.refresh_from_db()

    recurring_reservations: list[RecurringReservation] = list(event.recurring_reservations.all())
    assert len(recurring_reservations) == 1
    assert recurring_reservations[0].application == application
    assert recurring_reservations[0].reservation_unit == reservation_unit

    reservations: list[Reservation] = list(recurring_reservations[0].reservations.all())
    assert len(reservations) == 4

    start_date = SOME_MONDAY.date() + datetime.timedelta(days=schedule.allocated_day)
    begin = datetime.datetime.combine(start_date, schedule.allocated_begin).astimezone(datetime.UTC)
    end = datetime.datetime.combine(start_date, schedule.allocated_end).astimezone(datetime.UTC)

    assert reservations[0].state == ReservationStateChoice.CONFIRMED
    assert reservations[0].begin == begin
    assert reservations[0].end == end

    assert reservations[1].state == ReservationStateChoice.CONFIRMED
    assert reservations[1].begin == begin + datetime.timedelta(days=7)
    assert reservations[1].end == end + datetime.timedelta(days=7)

    assert reservations[2].state == ReservationStateChoice.CONFIRMED
    assert reservations[2].begin == begin + datetime.timedelta(days=14)
    assert reservations[2].end == end + datetime.timedelta(days=14)

    assert reservations[3].state == ReservationStateChoice.CONFIRMED
    assert reservations[3].begin == begin + datetime.timedelta(days=21)
    assert reservations[3].end == end + datetime.timedelta(days=21)

    assert event.status == ApplicationEventStatusChoice.RESERVED


@freeze_time(SOME_MONDAY)
def test_approve_application_event_schedule__reservations_unsuccessful(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is approved
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_empty_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - Allocation data has been set on the application event schedule
    # - A recurring reservation has been created for the application event
    # - Reservations have been created for the recurring reservation,
    #   but they are DENIED since there isn't any opening hours data
    # - The application event status has changed to FAILED
    assert response.has_errors is False, response

    schedule.refresh_from_db()
    assert schedule.allocated_day == schedule.day
    assert schedule.allocated_begin == schedule.begin
    assert schedule.allocated_end == schedule.end
    assert schedule.allocated_reservation_unit == reservation_unit

    event.refresh_from_db()

    recurring_reservations: list[RecurringReservation] = list(event.recurring_reservations.all())
    reservations: list[Reservation] = list(recurring_reservations[0].reservations.all())
    assert len(reservations) == 4
    assert reservations[0].state == ReservationStateChoice.DENIED
    assert reservations[1].state == ReservationStateChoice.DENIED
    assert reservations[2].state == ReservationStateChoice.DENIED
    assert reservations[3].state == ReservationStateChoice.DENIED

    assert event.status == ApplicationEventStatusChoice.FAILED


@pytest.mark.parametrize(
    "missing_key",
    ["allocatedDay", "allocatedBegin", "allocatedEnd", "allocatedReservationUnit"],
)
@freeze_time(SOME_MONDAY)
def test_cannot_approve_application_event_schedule_with_incomplete_data(graphql, missing_key):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is approved
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    input_data.pop(missing_key)
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are errors in the response (the actual error is not that important)
    assert response.has_errors is True, response


@freeze_time(SOME_MONDAY)
def test_cannot_approve_if_application_is_not_in_allocation(graphql):
    # given:
    # - There is an open application that has been sent, but is not allocatable yet
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_received(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is approved
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == [
        "Schedule cannot be approved for application in status: 'RECEIVED'",
    ]


@freeze_time(SOME_MONDAY)
def test_cannot_approve_if_application_event_is_not_unallocated(graphql):
    # given:
    # - There is an application event that has already been approved
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    event = ApplicationEventFactory.create_in_status_approved(
        event_reservation_units__reservation_unit=reservation_unit,
    )
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is approved
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the application and event being in the wrong status
    assert response.field_error_messages() == [
        "Schedule cannot be approved for event in status: 'APPROVED'",
        "Schedule cannot be approved for application in status: 'HANDLED'",
    ]
