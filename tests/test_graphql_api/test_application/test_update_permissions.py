import pytest

from tests.factories import ApplicationFactory, UnitFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__update__regular_user(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A regular user is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.login_with_regular_user()

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response complains about mutation permissions
    assert response.error_message() == "No permission to update."


def test_application__update__regular_user__own_application(graphql):
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


def test_application__update__regular_user__own_application__application_period_over(graphql):
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
    assert response.error_message() == "No permission to update."


def test_application__update__general_admin(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A general admin is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_general_role()
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


def test_application__update__unit_admin(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A unit admin is using the system
    unit = UnitFactory.create()
    application = ApplicationFactory.create_in_status_draft(
        additional_information="foo",
        application_sections__reservation_unit_options__reservation_unit__unit=unit,
    )
    admin = UserFactory.create_with_unit_role(units=[unit])
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


def test_application__update__regular_user__own_application__working_memo(graphql):
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


def test_application__update__general_admin__working_memo(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A general admin is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    admin = UserFactory.create_with_general_role()
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
