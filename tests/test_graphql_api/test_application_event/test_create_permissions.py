import pytest

from applications.models import ApplicationEvent
from tests.factories import ApplicationFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import (
    CREATE_MUTATION,
    get_application_event_create_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_owner_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application event
    data = get_application_event_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_superuser_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to create a new application event
    data = get_application_event_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_other_user_cannot_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - Someone other than the owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to create a new application event
    data = get_application_event_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_general_admin_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - A general admin with application permissions is using the system
    application = ApplicationFactory.create_in_status_draft()
    general_admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(general_admin)

    # when:
    # - User tries to create a new application event
    data = get_application_event_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_service_sector_admin_can_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - A service sector admin for the application round's service sector,
    #   with application permissions, is using the system
    application = ApplicationFactory.create_in_status_draft()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

    # when:
    # - User tries to create a new application event
    data = get_application_event_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_service_sector_admin_for_other_service_sector_cannot_create_application_event(graphql):
    # given:
    # - There is draft application in an open application round
    # - A service sector admin for some other service sector than the application round's service sector,
    #   with application permissions, is using the system
    application = ApplicationFactory.create_in_status_draft()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

    # when:
    # - User tries to create a new application event
    data = get_application_event_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
