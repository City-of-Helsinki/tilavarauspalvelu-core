import pytest

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.models import ApplicationEvent
from tests.factories import ApplicationFactory, UserFactory
from tests.helpers import UserType

from .helpers import DECLINE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_general_admin_can_decline_application(graphql):
    # given:
    # - There is an application in the allocation stage of an application round
    # - A general admin is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(admin)

    # when:
    # - User tries to decline the application
    response = graphql(DECLINE_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application appears as handled in the database
    # - The application's event appears as declined in the database
    assert response.has_errors is False, None
    application.refresh_from_db()
    assert application.status == ApplicationStatusChoice.HANDLED
    event: ApplicationEvent = application.application_events.first()
    assert event.status == ApplicationEventStatusChoice.DECLINED


def test_service_sector_admin_can_decline_application(graphql):
    # given:
    # - There is an application in the allocation stage of an application round
    # - A service sector admin for the application round's service sector is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to decline the application
    response = graphql(DECLINE_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application appears as handled in the database
    # - The application's event appears as declined in the database
    assert response.has_errors is False, None
    application.refresh_from_db()
    assert application.status == ApplicationStatusChoice.HANDLED
    event: ApplicationEvent = application.application_events.first()
    assert event.status == ApplicationEventStatusChoice.DECLINED


def test_regular_user_cannot_decline_application(graphql):
    # given:
    # - There is an application in the allocation stage of an application round
    # - A regular user is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to decline the application
    response = graphql(DECLINE_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response complains about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_application_owner_cannot_decline_own_application(graphql):
    # given:
    # - There is an application in the allocation stage of an application round
    # - The application user is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    graphql.force_login(application.user)

    # when:
    # - User tries to decline the application
    response = graphql(DECLINE_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response complains about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
