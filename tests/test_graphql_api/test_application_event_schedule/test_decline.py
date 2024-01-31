import pytest

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.models import ApplicationEvent, ApplicationEventSchedule
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType

from .helpers import DECLINE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_decline_application_event_schedule(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application event schedule is declined
    response = graphql(DECLINE_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - There are no errors in the response
    # - The application event schedule is marked as declined
    # - The application event status has changed to DECLINED
    assert response.has_errors is False, response

    schedule.refresh_from_db()
    assert schedule.declined is True

    event.refresh_from_db()
    assert event.status == ApplicationEventStatusChoice.DECLINED


@pytest.mark.parametrize(
    ("status", "application_status", "errors"),
    [
        (
            ApplicationEventStatusChoice.DECLINED,
            ApplicationStatusChoice.IN_ALLOCATION,
            [
                "Schedule cannot be declined for event in status: 'DECLINED'",
                "Schedule cannot be declined for application in status: 'HANDLED'",
            ],
        ),
        (
            ApplicationEventStatusChoice.RESERVED,
            ApplicationStatusChoice.IN_ALLOCATION,
            [
                "Schedule cannot be declined for event in status: 'RESERVED'",
                "Schedule cannot be declined for application in status: 'HANDLED'",
            ],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.DRAFT,
            ["Schedule cannot be declined for application in status: 'DRAFT'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.HANDLED,
            ["Schedule cannot be declined for application in status: 'HANDLED'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.RESULTS_SENT,
            ["Schedule cannot be declined for application in status: 'RESULT_SENT'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.EXPIRED,
            ["Schedule cannot be declined for application in status: 'EXPIRED'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.CANCELLED,
            ["Schedule cannot be declined for application in status: 'CANCELLED'"],
        ),
    ],
)
def test_cannot_decline_application_event_schedule_in_certain_statuses(graphql, status, application_status, errors):
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
    # - The application event schedule is declined
    response = graphql(DECLINE_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - The response complains about the status of the application event or application
    # - The application event is in the same status
    assert response.field_error_messages() == errors

    event.refresh_from_db()
    assert event.status == status, response
