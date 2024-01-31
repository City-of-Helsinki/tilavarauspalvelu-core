import pytest

from applications.models import ApplicationEvent
from tests.factories import ApplicationEventFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import (
    DELETE_MUTATION,
    get_application_event_delete_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_owner_can_delete_application_event(graphql):
    # given:
    # - There is an unallocated application event
    # - The owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.force_login(application_event.application.user)

    # when:
    # - User tries to delete an application event
    data = get_application_event_delete_data(application_event)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The response indicates the application event has been deleted
    # - The application event no longer exists in the database
    assert response.has_errors is False, response
    assert response.first_query_object["deleted"] is True
    assert ApplicationEvent.objects.filter(pk=application_event.pk).exists() is False


def test_superuser_can_delete_application_event(graphql):
    # given:
    # - There is an unallocated application event
    # - A superuser is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to delete an application event
    data = get_application_event_delete_data(application_event)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The response indicates the application event has been deleted
    # - The application event no longer exists in the database
    assert response.has_errors is False, response
    assert response.first_query_object["deleted"] is True
    assert ApplicationEvent.objects.filter(pk=application_event.pk).exists() is False


def test_other_user_cannot_delete_application_event(graphql):
    # given:
    # - There is an unallocated application event
    # - Someone other than the owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to delete an application event
    data = get_application_event_delete_data(application_event)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
