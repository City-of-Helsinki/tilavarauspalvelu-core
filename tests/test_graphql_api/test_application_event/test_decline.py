import pytest

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import DECLINE_MUTATION, get_application_event_decline_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize(
    ("status", "application_status", "errors"),
    [
        (
            ApplicationEventStatusChoice.DECLINED,
            ApplicationStatusChoice.IN_ALLOCATION,
            [
                "Event cannot be declined in status: 'DECLINED'",
                "Event cannot be declined when application in status: 'HANDLED'",
            ],
        ),
        (
            ApplicationEventStatusChoice.RESERVED,
            ApplicationStatusChoice.IN_ALLOCATION,
            [
                "Event cannot be declined in status: 'RESERVED'",
                "Event cannot be declined when application in status: 'HANDLED'",
            ],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.DRAFT,
            ["Event cannot be declined when application in status: 'DRAFT'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.HANDLED,
            ["Event cannot be declined when application in status: 'HANDLED'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.RESULTS_SENT,
            ["Event cannot be declined when application in status: 'RESULT_SENT'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.EXPIRED,
            ["Event cannot be declined when application in status: 'EXPIRED'"],
        ),
        (
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationStatusChoice.CANCELLED,
            ["Event cannot be declined when application in status: 'CANCELLED'"],
        ),
    ],
)
def test_cannot_decline_application_event_in_certain_statuses(graphql, status, application_status, errors):
    # given:
    # - There is an application event with the given status in an application with the given status
    # - A superuser is using the system
    application_event = ApplicationEventFactory.create_in_status(
        status=status,
        application=ApplicationFactory.create_in_status(application_status, application_events=None),
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to update the application event
    data = get_application_event_decline_data(application_event)
    response = graphql(DECLINE_MUTATION, input_data=data)

    # then:
    # - The response complains about the status of the application event or application
    # - The application event is in the same status
    assert response.field_error_messages() == errors

    application_event.refresh_from_db()
    assert application_event.status == status, response
