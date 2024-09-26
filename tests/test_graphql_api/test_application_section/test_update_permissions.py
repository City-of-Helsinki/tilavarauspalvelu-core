import pytest

from tests.factories import ApplicationSectionFactory, UserFactory
from tests.test_graphql_api.test_application_section.helpers import UPDATE_MUTATION, get_application_section_update_data
from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__update__perms__application_owner(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - The owner of the application is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.force_login(application_section.application.user)

    # when:
    # - User tries to update the application section
    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application section
    assert response.has_errors is False, response

    application_sections: list[ApplicationSection] = list(ApplicationSection.objects.all())
    assert len(application_sections) == 1


def test_application_section__update__perms__superuser(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section
    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application section
    assert response.has_errors is False, response

    application_sections: list[ApplicationSection] = list(ApplicationSection.objects.all())
    assert len(application_sections) == 1


def test_application_section__update__perms__regular_user(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - Someone other than the owner of the application is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_regular_user()

    # when:
    # - User tries to update the application section
    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.error_message() == "No permission to update."


def test_application_section__update__perms__general_admin(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A general admin with application permissions is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    general_admin = UserFactory.create_with_general_role()
    graphql.force_login(general_admin)

    # when:
    # - User tries to update the application section
    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application section
    assert response.has_errors is False, response

    application_sections: list[ApplicationSection] = list(ApplicationSection.objects.all())
    assert len(application_sections) == 1
