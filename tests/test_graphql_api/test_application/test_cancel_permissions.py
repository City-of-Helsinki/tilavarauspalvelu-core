import pytest

from tests.factories import ApplicationFactory, UnitFactory, UserFactory

from .helpers import CANCEL_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__cancel__regular_user(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - A regular user is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_regular_user()

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about mutation permissions
    assert response.error_message() == "No permission to update."


def test_application__cancel__regular_user__own_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application has a send date
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.cancelled_date is not None


def test_application__cancel__regular_user__own_application__application_period_over(graphql):
    # given:
    # - There an application round in allocation with a single application
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    graphql.force_login(application.user)

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors
    assert response.error_message() == "No permission to update."


def test_application__cancel__general_user(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application has a send date
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.cancelled_date is not None


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
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    assert response.has_errors is False, response
