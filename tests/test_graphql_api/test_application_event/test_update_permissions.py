import pytest

from applications.models import ApplicationEvent
from tests.factories import ApplicationEventFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import (
    UPDATE_MUTATION,
    get_application_event_update_data,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_owner_can_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - The owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.force_login(application_event.application.user)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_superuser_can_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - A superuser is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_other_user_cannot_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - Someone other than the owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_general_admin_can_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - A general admin with application permissions is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    general_admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(general_admin)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_service_sector_admin_can_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - A service sector admin for the application round's service sector,
    #   with application permissions, is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application_event.application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1


def test_service_sector_admin_for_other_service_sector_cannot_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - A service sector admin for some other service sector than the application round's service sector,
    #   with application permissions, is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about mutation permissions
    assert response.field_error_messages() == ["No permission to mutate."]
