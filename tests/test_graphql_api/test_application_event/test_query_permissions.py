import pytest

from tests.factories import ApplicationEventFactory, UnitFactory, UnitGroupFactory, UserFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import events_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_anonymous_user_cannot_view_events(graphql):
    # given:
    # - There is an application event
    # - An anonymous user is using the system
    ApplicationEventFactory.create_in_status_unallocated()

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains an error about permissions
    assert response.error_message() == "You do not have permission to access this node."


def test_superuser_can_view_all_events(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains all events
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_regular_user_can_only_view_own_events(graphql):
    # given:
    # - There are two application events
    # - The owner of one of those application events is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    ApplicationEventFactory.create_in_status_unallocated()
    graphql.force_login(event_1.application.user)

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains only the application event belonging to the user
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event_1.pk}


def test_general_admin_can_view_events_in_all_sectors(graphql):
    # given:
    # - There are two application events in different service sectors
    # - A general service sector admin is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    user = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(user)

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains events from both sectors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_service_sector_admin_can_view_events_in_their_sector(graphql):
    # given:
    # - There are two application events in different service sectors
    # - A service sector admin for one of those sectors is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    ApplicationEventFactory.create_in_status_unallocated()
    user = UserFactory.create_with_service_sector_permissions(
        event_1.application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(user)

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains only the application event belonging to the user's administered service sector
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event_1.pk}


def test_unit_admin_can_view_events_in_their_unit(graphql):
    # given:
    # - There are two application events with different units
    # - A unit admin for one of those units is using the system
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit=unit_1,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit=unit_2,
    )
    user = UserFactory.create_with_unit_permissions(unit_1, perms=["can_validate_applications"])
    graphql.force_login(user)

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains only the application event belonging to the user's administered unit
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event_1.pk}


def test_unit_group_admin_can_view_events_in_their_unit_group(graphql):
    # given:
    # - There are two application events with different unit groups
    # - A unit admin for one of those unit groups is using the system
    group_1 = UnitGroupFactory.create()
    group_2 = UnitGroupFactory.create()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__unit_groups=[group_1],
    )
    ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__unit_groups=[group_2],
    )
    user = UserFactory.create_with_unit_group_permissions(group_1, perms=["can_validate_applications"])
    graphql.force_login(user)

    # when:
    # - The user queries for application events
    response = graphql(events_query())

    # then:
    # - The response contains only the application event belonging to the user's administered unit group
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event_1.pk}
