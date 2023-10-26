import pytest

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.models import ApplicationEvent
from tests.factories import ApplicationFactory
from tests.helpers import UserType

from .helpers import DECLINE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_decline_application(graphql):
    # given:
    # - There is an application in the allocation stage of an application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application is declined
    response = graphql(DECLINE_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application appears as handled in the database
    # - The application's event appears as declined in the database
    assert response.has_errors is False, None
    application.refresh_from_db()
    assert application.status == ApplicationStatusChoice.HANDLED
    event: ApplicationEvent = application.application_events.first()
    assert event.status == ApplicationEventStatusChoice.DECLINED


@pytest.mark.parametrize(
    "status",
    [
        ApplicationStatusChoice.DRAFT,
        ApplicationStatusChoice.HANDLED,
        ApplicationStatusChoice.RESULTS_SENT,
        ApplicationStatusChoice.EXPIRED,
        ApplicationStatusChoice.CANCELLED,
    ],
)
def test_cannot_decline_application_in_status(graphql, status):
    # given:
    # - There is an application of a certain status
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status(status)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The application is declined
    response = graphql(DECLINE_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response complains about the application's status
    assert response.field_error_messages() == [f"Application in status '{status.value}' cannot be declined."]
