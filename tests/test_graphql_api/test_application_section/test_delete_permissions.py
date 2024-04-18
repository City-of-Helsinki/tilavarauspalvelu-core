import pytest

from applications.models import ApplicationSection
from tests.factories import ApplicationSectionFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_section.helpers import DELETE_MUTATION, get_application_section_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_owner_can_delete_application_event(graphql):
    # given:
    # - There is an unallocated application section
    # - The owner of the application is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.force_login(section.application.user)

    # when:
    # - User tries to delete an application event
    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The response indicates the application event has been deleted
    # - The application section no longer exists in the database
    assert response.has_errors is False, response
    assert response.first_query_object["deleted"] is True
    assert ApplicationSection.objects.filter(pk=section.pk).exists() is False


def test_superuser_can_delete_application_event(graphql):
    # given:
    # - There is an unallocated application section
    # - A superuser is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to delete an application event
    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The response indicates the application event has been deleted
    # - The application section no longer exists in the database
    assert response.has_errors is False, response
    assert response.first_query_object["deleted"] is True
    assert ApplicationSection.objects.filter(pk=section.pk).exists() is False


def test_other_user_cannot_delete_application_event(graphql):
    # given:
    # - There is an unallocated application event
    # - Someone other than the owner of the application is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to delete an application section
    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.error_message() == "No permission to delete."
