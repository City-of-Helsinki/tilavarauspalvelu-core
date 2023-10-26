import pytest

from applications.choices import ApplicationEventStatusChoice
from tests.factories import ApplicationEventFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import DELETE_MUTATION, get_application_event_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


@pytest.mark.parametrize(
    "status",
    [
        ApplicationEventStatusChoice.APPROVED,
        ApplicationEventStatusChoice.DECLINED,
        ApplicationEventStatusChoice.RESERVED,
        ApplicationEventStatusChoice.FAILED,
    ],
)
def test_cannot_delete_application_event_not_unallocated(graphql, status):
    # given:
    # - There is an application event with the given status
    # - A superuser is using the system
    application_event = ApplicationEventFactory.create_in_status(status)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to delete an application event
    data = get_application_event_delete_data(application_event)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about modifying the event
    assert response.field_error_messages() == ["Application event has been allocated and cannot be deleted anymore."]
