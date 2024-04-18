import pytest

from applications.models import ApplicationSection
from tests.factories import ApplicationSectionFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_section.helpers import UPDATE_MUTATION, get_application_section_update_data

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
    graphql.login_user_based_on_type(UserType.SUPERUSER)

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
    graphql.login_user_based_on_type(UserType.REGULAR)

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
    general_admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
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


def test_application_section__update__perms__service_sector(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A service sector admin for the application round's service sector,
    #   with application permissions, is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application_section.application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

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


def test_application_section__update__perms__service_sector_admin__for_other_service_sector(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A service sector admin for some other service sector than the application round's service sector,
    #   with application permissions, is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

    # when:
    # - User tries to update the application section
    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.error_message() == "No permission to update."
