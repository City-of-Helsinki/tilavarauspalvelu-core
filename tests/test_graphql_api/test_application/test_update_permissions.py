import pytest

from tests.factories import ApplicationFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
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


def test_application_owner_cannot_update_own_application_after_application_period_over(graphql):
    # given:
    # - There an application round in allocation with a single application
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_in_allocation(additional_information="foo")
    graphql.force_login(application.user)

    input_data = {
        "pk": application.pk,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors
    assert response.field_error_messages() == ["No permission to mutate."]


def test_application_user_cannot_update_own_application_working_memo(graphql):
    # given:
    # - There is a draft application in an open application round
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.force_login(application.user)

    # when:
    # - User tries to update the application working memo
    input_data = {
        "pk": application.id,
        "workingMemo": "123",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about accessing the working memo
    assert response.field_error_messages("workingMemo") == ["No permission to access working memo."]


def test_service_sector_admin_cannot_update_other_users_working_memo(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A service sector admin for the application round's service sector is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to update the application working memo
    input_data = {
        "pk": application.id,
        "workingMemo": "123",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors about accessing the working memo
    assert response.field_error_messages("workingMemo") == ["No permission to access working memo."]


def test_general_admin_can_update_other_users_working_memo(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A general admin is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_general_permissions(perms=["can_validate_applications"])
    graphql.force_login(admin)

    # when:
    # - User tries to update the application working memo
    input_data = {
        "pk": application.id,
        "workingMemo": "123",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    assert response.has_errors is False, response
