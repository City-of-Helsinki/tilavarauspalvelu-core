import pytest

from tests.factories import ApplicationFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_user_can_update_own_application(graphql):
    # given:
    # - There is a draft application in an open application round
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.force_login(application.user)

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    assert response.has_errors is False, response


def test_regular_user_can_update_other_users_application(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A regular user other than the application owner is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_general_admin_can_update_other_users_application(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A general admin is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(admin)

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    assert response.has_errors is False, response


def test_service_sector_admin_can_update_other_users_application(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A service sector adin for the application round's service sector is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    assert response.has_errors is False, response


def test_service_sector_admin_for_other_sector_cannot_update_other_users_application(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A service sector adin for the application round's service sector is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
