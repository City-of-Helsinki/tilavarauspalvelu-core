import datetime
from typing import Any

import pytest
from django.utils.timezone import get_default_timezone

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice, WeekdayChoice
from applications.models import Application, ApplicationEvent, ApplicationEventSchedule
from reservation_units.models import ReservationUnit
from tests.factories import (
    ApplicationEventScheduleFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ReservationUnitFactory,
    SpaceFactory,
)
from tests.helpers import UserType

from .helpers import APPROVE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def approve_data(application: Application, *, begin: str, end: str, force: bool = False) -> dict[str, Any]:
    """Generate approve mutation input data for the last schedule of the given application's first event."""
    event: ApplicationEvent = application.application_events.first()
    reservation_unit: ReservationUnit = event.event_reservation_units.first().reservation_unit
    schedule: ApplicationEventSchedule = event.application_event_schedules.order_by("pk").last()
    return {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": begin,
        "allocatedEnd": end,
        "allocatedReservationUnit": reservation_unit.pk,
        "force": force,
    }


def test_approve_schedule__can_approve_unallocated_event_schedule(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    event = application.application_events.first()
    assert event.status == ApplicationEventStatusChoice.UNALLOCATED

    # when:
    # - The application event schedule is approved
    input_data = approve_data(application, begin="10:00:00", end="12:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The application event status has changed to ALLOCATED
    assert response.has_errors is False, response

    event.refresh_from_db()
    assert event.status == ApplicationEventStatusChoice.APPROVED


def test_approve_schedule__can_approve_approved_event_schedule(graphql):
    # given:
    # - There is an application event with one approved and one unallocated schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(events_per_week=1, pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Un-allocate one of the approved schedule
    event = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.order_by("pk").first()
    schedule.allocated_day = None
    schedule.allocated_begin = None
    schedule.allocated_end = None
    schedule.allocated_reservation_unit = None
    schedule.save()

    # Event is still approved because there is another approved schedule
    assert event.status == ApplicationEventStatusChoice.APPROVED

    # when:
    # - The unallocated application event schedule is approved
    input_data = approve_data(application, begin="10:00:00", end="12:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The event is still approved
    assert response.has_errors is False, response

    event.refresh_from_db()
    assert event.status == ApplicationEventStatusChoice.APPROVED


@pytest.mark.parametrize(
    "missing_key",
    ["allocatedDay", "allocatedBegin", "allocatedEnd", "allocatedReservationUnit"],
)
def test_approve_schedule__incomplete_data(graphql, missing_key):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is approved
    input_data = approve_data(application, begin="10:00:00", end="12:00:00")
    input_data.pop(missing_key)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are errors in the response (the actual error is not that important)
    assert response.has_errors is True, response


def test_approve_schedule__application_not_yet_in_allocation(graphql):
    # given:
    # - There is an open application that has been sent, but is not allocatable yet
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_upcoming()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert application.status == ApplicationStatusChoice.RECEIVED

    # when:
    # - The application event schedule is approved
    input_data = approve_data(application, begin="10:00:00", end="12:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == [
        "Schedule cannot be approved for application in status: 'RECEIVED'",
    ]


def test_approve_schedule__application_not_in_allocation_anymore(graphql):
    # given:
    # - There is an application event that has already been approved
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert application.status == ApplicationStatusChoice.HANDLED

    # when:
    # - The application event schedule is approved
    input_data = approve_data(application, begin="10:00:00", end="12:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the application and event being in the wrong status
    assert response.field_error_messages() == [
        "Schedule cannot be approved for application in status: 'HANDLED'",
    ]


def test_approve_schedule__cannot_approve_duration_longer_than_event_maximum(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule so that it's
    #   longer than the maximum allowed duration.
    input_data = approve_data(application, begin="10:00:00", end="12:15:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the duration being too long
    assert response.field_error_messages("allocatedEnd") == [
        "Allocation duration too long. Maximum allowed is 02:00:00 while given duration is 02:15:00."
    ]


def test_approve_schedule__can_approve_duration_longer_than_event_maximum_with_force_flag(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule so that it's
    #   longer than the maximum allowed duration, but uses the force flag.
    input_data = approve_data(application, begin="10:00:00", end="12:15:00", force=True)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_approve_schedule__cannot_approve_duration_shorter_than_event_minimum(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule so that it's
    #   shorter than the minimum allowed duration.
    input_data = approve_data(application, begin="10:00:00", end="10:45:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the duration being too long
    assert response.field_error_messages("allocatedEnd") == [
        "Allocation duration too short. Minimum allowed is 01:00:00 while given duration is 00:45:00."
    ]


def test_approve_schedule__can_approve_duration_shorter_than_event_minimum_with_force_flag(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule so that it's
    #   shorter than the minimum allowed duration, but uses the force flag.
    input_data = approve_data(application, begin="10:00:00", end="10:45:00", force=True)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_approve_schedule__cannot_approve_duration_not_multiple_of_15_minutes(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule which is not
    #   a multiple of 15 minutes.
    input_data = approve_data(application, begin="10:00:00", end="11:00:01")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the duration being too long
    assert response.field_error_messages("allocatedEnd") == ["Allocation duration must be a multiple of 15 minutes."]


def test_approve_schedule__can_approve_duration_not_multiple_of_15_minutes_with_force_flag(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule which is not
    #   a multiple of 15 minutes, but uses the force flag.
    input_data = approve_data(application, begin="10:00:00", end="11:00:01", force=True)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_approve_schedule__cannot_approve_more_events_than_events_per_week(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    ApplicationEventScheduleFactory.create(
        day=WeekdayChoice.WEDNESDAY,
        application_event=application.application_events.first(),
    )

    # when:
    # - The user tries to allocate the schedule, but there are already
    #   maximum number of schedules allocated.
    input_data = approve_data(application, begin="12:00:00", end="14:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about too many events already being allocated
    assert response.field_error_messages() == [
        "Cannot allocate more schedules for this event. Maximum allowed is 2.",
    ]


def test_approve_schedule__can_approve_more_events_than_events_per_week_with_force_flag(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    ApplicationEventScheduleFactory.create(
        day=WeekdayChoice.WEDNESDAY,
        application_event=application.application_events.first(),
    )

    # when:
    # - The user tries to allocate the schedule, but there are already
    #   maximum number of schedules allocated, but uses the force flag.
    input_data = approve_data(application, begin="12:00:00", end="14:00:00", force=True)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_approve_schedule__cannot_approve_event_outside_of_wished_period(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule, but it does not fall
    #   within the applicants the wished periods.
    input_data = approve_data(application, begin="14:00:00", end="15:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the allocated time being invalid.
    assert response.field_error_messages() == [
        "Cannot allocate schedule for this day and time period. "
        "Given time period does not fit within applicants wished periods.",
    ]


def test_approve_schedule__can_approve_event_outside_of_wished_period_with_force_flag(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule, but it does not fall
    #   within the applicants the wished periods, but uses the force flag.
    input_data = approve_data(application, begin="14:00:00", end="15:00:00", force=True)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_approve_schedule__approved_time_falls_on_two_back_to_back_wished_times(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    ApplicationEventScheduleFactory.create(
        application_event=application.application_events.first(),
        day=WeekdayChoice.MONDAY,
        begin=datetime.time(14, 0, tzinfo=get_default_timezone()),
        end=datetime.time(16, 0, tzinfo=get_default_timezone()),
    )

    # when:
    # - The user tries to allocate the schedule, and it falls
    #   on two of the applicants the wished periods.
    input_data = approve_data(application, begin="13:00:00", end="15:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_approve_schedule__approved_time_falls_on_two_separated_wished_times(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    ApplicationEventScheduleFactory.create(
        application_event=application.application_events.first(),
        day=WeekdayChoice.MONDAY,
        begin=datetime.time(14, 30, tzinfo=get_default_timezone()),
        end=datetime.time(16, 0, tzinfo=get_default_timezone()),
    )

    # when:
    # - The user tries to allocate the schedule, and it falls
    #   on two of the applicants the wished periods.
    input_data = approve_data(application, begin="13:00:00", end="15:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the allocated time being invalid.
    assert response.field_error_messages() == [
        "Cannot allocate schedule for this day and time period. "
        "Given time period does not fit within applicants wished periods.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_approve_schedule__cannot_approve_to_reservation_unit_not_in_event_reservation_units(graphql, force):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule, but for a reservation unit
    #   not in the event's event reservation units.
    input_data = approve_data(application, begin="10:00:00", end="12:00:00", force=force)
    input_data["allocatedReservationUnit"] = ReservationUnitFactory.create().pk
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the reservation unit not being included.
    assert response.field_error_messages("allocatedReservationUnit") == [
        "Cannot allocate schedule for this reservation unit. Reservation unit is not included in the event.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_approve_schedule__cannot_approve_two_schedules_for_same_day(graphql, force):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(events_per_week=3, pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    ApplicationEventScheduleFactory.create(
        day=WeekdayChoice.MONDAY,
        application_event=application.application_events.first(),
    )

    # when:
    # - The user tries to allocate the schedule, but allocation
    #   is on the same day as another allocation for the same event.
    input_data = approve_data(application, begin="12:00:00", end="14:00:00", force=force)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the allocations overlapping.
    assert response.field_error_messages("allocatedDay") == [
        "Cannot allocate multiple schedules on the same day for one event.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_approve_schedule__cannot_approve_if_overlapping_with_another_approved_in_same_reservation_unit(graphql, force):
    # given:
    # - There is an allocatable application event schedule
    # - There is an overlapping approved schedule for the same reservation unit
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])
    application = ApplicationFactory.create_application_ready_for_allocation(reservation_unit=reservation_unit)
    ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=reservation_unit,
        pre_allocated=True,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule, but there is already
    #   an allocation for the same reservation unit at that time.
    input_data = approve_data(application, begin="10:00:00", end="11:00:00", force=force)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the there being another allocation already.
    assert response.field_error_messages() == [
        "Cannot allocate schedule for this day and time period. "
        "Given time period has already been allocated for another event with the same reservation unit.",
    ]


def test_approve_schedule__can_approve_if_overlapping_with_another_approved_in_different_reservation_unit(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - There is an overlapping approved schedule for a different reservation unit
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to allocate the schedule, but there is already
    #   an allocation for the same reservation unit at that time.
    input_data = approve_data(application, begin="10:00:00", end="11:00:00")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


@pytest.mark.parametrize("force", [True, False])
def test_approve_schedule__cannot_approve_if_event_doesnt_have_begin_and_end_dates(graphql, force):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Event doesn't have start and end dates
    event = application.application_events.first()
    event.begin = None
    event.end = None
    event.save()

    # when:
    # - The user tries to allocate the schedule
    input_data = approve_data(application, begin="10:00:00", end="11:00:00", force=force)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about event begin and end dates
    assert response.field_error_messages() == [
        "Cannot allocate schedule for this day and time period. Event begin and end dates must be set."
    ]
