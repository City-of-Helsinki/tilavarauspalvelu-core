import pytest

from tests.factories import ApplicationRoundFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION, get_application_create_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_unauthenticated_cannot_create_application(graphql):
    # given:
    # - There is an open application round
    # - An anonymous user is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - User tries to create a new application
    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about missing permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_regular_user_can_create_application(graphql):
    # given:
    # - There is an open application round
    # - A regular user is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to create a new application
    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    assert response.has_errors is False, response
