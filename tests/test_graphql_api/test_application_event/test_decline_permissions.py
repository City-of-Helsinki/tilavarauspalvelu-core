import pytest

from applications.choices import ApplicationEventStatusChoice
from tests.factories import ApplicationFactory, UserFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import DECLINE_MUTATION, get_application_event_decline_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_general_admin_can_decline_application_event(graphql):
    # given:
    # - There is an unallocated application event in the allocation stage of the application round
    # - A general admin with application permissions is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    application_event = application.application_events.first()
    general_admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(general_admin)

    # when:
    # - User tries to update the application event
    data = get_application_event_decline_data(application_event)
    response = graphql(DECLINE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The application event has been marked as declined
    assert response.has_errors is False, response

    application_event.refresh_from_db()
    assert application_event.status == ApplicationEventStatusChoice.DECLINED, response


def test_service_sector_admin_can_decline_application_event(graphql):
    # given:
    # - There is an unallocated application event in the allocation stage of the application round
    # - A service sector admin with application permissions is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    application_event = application.application_events.first()
    service_sector_admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(service_sector_admin)

    # when:
    # - User tries to update the application event
    data = get_application_event_decline_data(application_event)
    response = graphql(DECLINE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The application event has been marked as declined
    assert response.has_errors is False, response

    application_event.refresh_from_db()
    assert application_event.status == ApplicationEventStatusChoice.DECLINED, response


def test_regular_user_cannot_decline_application_event(graphql):
    # given:
    # - There is an unallocated application event in the allocation stage of the application round
    # - A regular user is using the system
    application = ApplicationFactory.create_in_status_in_allocation()
    application_event = application.application_events.first()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to update the application event
    data = get_application_event_decline_data(application_event)
    response = graphql(DECLINE_MUTATION, input_data=data)

    # then:
    # - The response complains about mutation permissions
    # - The application event is still unallocated
    assert response.field_error_messages() == ["No permission to mutate."]

    application_event.refresh_from_db()
    assert application_event.status == ApplicationEventStatusChoice.UNALLOCATED, response
