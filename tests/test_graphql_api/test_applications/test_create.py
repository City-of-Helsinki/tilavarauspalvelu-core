import pytest

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    EventReservationUnit,
    Organisation,
    Person,
)
from tests.factories import ApplicationRoundFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_applications.helpers import get_application_create_data

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_create_application(graphql):
    # given:
    # - There is an open application round
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to create a new application without events
    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - An application is created
    # - An organisation is created for the application
    # - An address is created for the organisation
    # - A contact person is created for the application
    # - A billing address is created for the application
    # - No application events are created
    assert response.has_errors is False, response
    assert Application.objects.count() == 1
    assert Organisation.objects.count() == 1
    assert Person.objects.count() == 1  # contact person
    assert Address.objects.count() == 2  # billing and organisation addresses
    assert ApplicationEvent.objects.count() == 0


def test_create_application_with_application_events(graphql):
    # given:
    # - There is an open application round
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert Application.objects.count() == 0

    # when:
    # - User tries to create a new application without events
    input_data = get_application_create_data(application_round, create_events=True)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - An application is created
    # - An organisation is created for the application
    # - An address is created for the organisation
    # - A contact person is created for the application
    # - A billing address is created for the application
    # - An application event is created for the application
    # - An application event schedule is created for the application event
    # - An event reservation unit is created for the application event
    assert response.has_errors is False, response
    assert Application.objects.count() == 1
    assert Organisation.objects.count() == 1
    assert Person.objects.count() == 1  # contact person
    assert Address.objects.count() == 2  # billing and organisation addresses
    assert ApplicationEvent.objects.count() == 1
    assert ApplicationEventSchedule.objects.count() == 1
    assert EventReservationUnit.objects.count() == 1
