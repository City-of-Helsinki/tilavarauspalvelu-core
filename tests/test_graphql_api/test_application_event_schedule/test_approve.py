import pytest

from applications.choices import ApplicationEventStatusChoice
from applications.models import Application, ApplicationEvent, ApplicationEventSchedule
from tests.factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationFactory,
    ReservationUnitFactory,
)
from tests.helpers import UserType

from .helpers import APPROVE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_approve_application_event_schedule__can_approve_event_in_allocation(graphql):
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
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - Allocation data has been set on the application event schedule
    # - The application event status has changed to ALLOCATED
    assert response.has_errors is False, response

    schedule.refresh_from_db()
    assert schedule.allocated_day == schedule.day
    assert schedule.allocated_begin == schedule.begin
    assert schedule.allocated_end == schedule.end
    assert schedule.allocated_reservation_unit == reservation_unit

    event.refresh_from_db()
    assert event.status == ApplicationEventStatusChoice.APPROVED


def test_approve_application_event_schedule__can_approve_already_approved_event(graphql):
    # given:
    # - There is an application event with one approved and one unallocated schedule
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    event: ApplicationEvent = ApplicationEventFactory.create_in_status_approved(
        event_reservation_units__reservation_unit=reservation_unit,
    )
    schedule: ApplicationEventSchedule = ApplicationEventScheduleFactory.create(application_event=event)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert event.application_event_schedules.count() == 2
    assert event.status == ApplicationEventStatusChoice.APPROVED

    # when:
    # - The unallocated application event schedule is approved
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - Allocation data has been set on the application event schedule
    assert response.has_errors is False, response

    schedule.refresh_from_db()
    assert schedule.allocated_day == schedule.day
    assert schedule.allocated_begin == schedule.begin
    assert schedule.allocated_end == schedule.end
    assert schedule.allocated_reservation_unit == reservation_unit


@pytest.mark.parametrize(
    "missing_key",
    ["allocatedDay", "allocatedBegin", "allocatedEnd", "allocatedReservationUnit"],
)
def test_cannot_approve_application_event_schedule_with_incomplete_data(graphql, missing_key):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application: Application = ApplicationFactory.create_in_status_in_allocation(
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
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are errors in the response (the actual error is not that important)
    assert response.has_errors is True, response


def test_cannot_approve_if_application_is_not_in_allocation(graphql):
    # given:
    # - There is an open application that has been sent, but is not allocatable yet
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application: Application = ApplicationFactory.create_in_status_received(
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
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == [
        "Schedule cannot be approved for application in status: 'RECEIVED'",
    ]


def test_cannot_approve_if_application_is_not_in_unallocated(graphql):
    # given:
    # - There is an application event that has already been approved
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create()
    application: Application = ApplicationFactory.create_in_status_handled()
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
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about the application and event being in the wrong status
    assert response.field_error_messages() == [
        "Schedule cannot be approved for application in status: 'HANDLED'",
    ]
