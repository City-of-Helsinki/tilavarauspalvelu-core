import pytest

from tests.factories import ApplicationFactory, UserFactory
from tests.test_graphql_api.test_application_section.helpers import CREATE_MUTATION, get_application_section_create_data
from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_owner_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application event
    data = get_application_section_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    assert ApplicationSection.objects.count() == 1


def test_superuser_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.login_with_superuser()

    # when:
    # - User tries to create a new application event
    data = get_application_section_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    assert ApplicationSection.objects.count() == 1


def test_other_user_cannot_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - Someone other than the owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.login_with_regular_user()

    # when:
    # - User tries to create a new application event
    data = get_application_section_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.error_message() == "No permission to create."

    assert ApplicationSection.objects.count() == 0


def test_general_admin_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - A general admin with application permissions is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    general_admin = UserFactory.create_with_general_role()
    graphql.force_login(general_admin)

    # when:
    # - User tries to create a new application event
    data = get_application_section_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    assert ApplicationSection.objects.count() == 1
