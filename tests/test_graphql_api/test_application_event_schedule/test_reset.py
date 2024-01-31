import pytest

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.models import ApplicationEvent, ApplicationEventSchedule
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType

from .helpers import RESET_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reset_application_event_schedule(graphql):
    # given:
    # - There is a handled application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_handled()
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is reset
    response = graphql(RESET_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - There are no errors in the response
    # - The application event schedule is not marked as declined
    # - All `allocated_*` fields are set to None
    assert response.has_errors is False, response

    schedule.refresh_from_db()
    assert schedule.declined is False
    assert schedule.allocated_day is None
    assert schedule.allocated_begin is None
    assert schedule.allocated_end is None
    assert schedule.allocated_reservation_unit is None

    event.refresh_from_db()
    assert event.status == ApplicationEventStatusChoice.UNALLOCATED


@pytest.mark.parametrize(
    ("status", "application_status", "errors"),
    [
        (
            ApplicationEventStatusChoice.FAILED,
            ApplicationStatusChoice.DRAFT,
            [
                "Schedule cannot be reset for event in status: 'FAILED'",
                "Schedule cannot be reset for application in status: 'DRAFT'",
            ],
        ),
        (
            ApplicationEventStatusChoice.RESERVED,
            ApplicationStatusChoice.RECEIVED,
            [
                "Schedule cannot be reset for event in status: 'RESERVED'",
                "Schedule cannot be reset for application in status: 'RECEIVED'",
            ],
        ),
        (
            ApplicationEventStatusChoice.APPROVED,
            ApplicationStatusChoice.RESULTS_SENT,
            ["Schedule cannot be reset for application in status: 'RESULT_SENT'"],
        ),
        (
            ApplicationEventStatusChoice.APPROVED,
            ApplicationStatusChoice.EXPIRED,
            ["Schedule cannot be reset for application in status: 'EXPIRED'"],
        ),
        (
            ApplicationEventStatusChoice.APPROVED,
            ApplicationStatusChoice.CANCELLED,
            ["Schedule cannot be reset for application in status: 'CANCELLED'"],
        ),
    ],
)
def test_cannot_reset_application_event_schedule_in_certain_statuses(graphql, status, application_status, errors):
    # given:
    # - There is an application event with the given status in an application with the given status
    # - A superuser is using the system
    event = ApplicationEventFactory.create_in_status(
        status=status,
        application=ApplicationFactory.create_in_status(application_status, application_events=None),
    )
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is reset
    response = graphql(RESET_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - The response complains about the status of the application event or application
    # - The application event is in the same status
    assert response.field_error_messages() == errors

    event.refresh_from_db()
    assert event.status == status, response
