import pytest

from tests.factories import ApplicationEventFactory, ApplicationFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType

from .helpers import CANCEL_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_owner_can_cancel_own_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationEventFactory.create(application=application)
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


def test_regular_user_cannot_cancel_other_user_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationEventFactory.create(application=application)
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_service_sector_admin_can_cancel_other_user_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - A service sector admin for the application round is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationEventFactory.create(application=application)
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
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


def test_service_sector_admin_can_cancel_application_for_other_sector(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - A service sector admin for some other service sector is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationEventFactory.create(application=application)
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
