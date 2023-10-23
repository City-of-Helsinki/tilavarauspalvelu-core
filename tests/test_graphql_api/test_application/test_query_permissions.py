import pytest

from applications.models import EventReservationUnit
from tests.factories import (
    ApplicationEventFactory,
    ApplicationFactory,
    ServiceSectorFactory,
    UnitFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.helpers import UserType

from .helpers import applications_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_anonymous_user_cannot_view_applications(graphql):
    # given:
    # - There is an application in the system
    # - An anonymous user is using the system
    ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response complains about permissions
    assert response.error_message() == "You do not have permission to access this node."


def test_regular_user_cannot_view_other_applications(graphql):
    # given:
    # - There is an application in the system
    # - A regular user is using the system
    ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, but is empty
    assert response.has_errors is False, response
    assert response.edges == []


def test_application_owner_can_view_own_applications(graphql):
    # given:
    # - There is an application in the system
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_service_sector_admin_can_view_applications(graphql):
    # given:
    # - There is an application in the system
    # - A service sector admin for the application round's service sector is using the system
    application = ApplicationFactory.create_in_status_draft()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_service_sector_admin_cannot_view_applications_for_other_sector(graphql):
    # given:
    # - There is an application in the system
    # - A service sector admin for some other sector is using the system
    ApplicationFactory.create_in_status_draft()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, but is empty
    assert response.has_errors is False, response
    assert response.edges == []


def test_unit_admin_can_view_applications(graphql):
    # given:
    # - There is an application event in an application with an event reservation unit
    # - A unit admin for that unit is using the system
    event = ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__name="foo",
    )
    event_reservation_unit: EventReservationUnit = event.event_reservation_units.first()
    admin = UserFactory.create_with_unit_permissions(
        unit=event_reservation_unit.reservation_unit.unit,
        perms=["can_validate_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event.application.pk}


def test_unit_admin_can_view_applications_for_other_units(graphql):
    # given:
    # - There is an application event in an application with an event reservation unit
    # - A unit admin for some other unit is using the system
    ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__name="foo",
    )
    admin = UserFactory.create_with_unit_permissions(
        unit=UnitFactory.create(name="bar"),
        perms=["can_validate_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, but is empty
    assert response.has_errors is False, response
    assert response.edges == []


def test_unit_group_admin_can_view_applications(graphql):
    # given:
    # - There is an application event in an application with an event reservation unit
    # - A unit group admin for that unit's group is using the system
    event = ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__unit_groups__name="foo",
    )
    event_reservation_unit: EventReservationUnit = event.event_reservation_units.first()
    admin = UserFactory.create_with_unit_group_permissions(
        unit_group=event_reservation_unit.reservation_unit.unit.unit_groups.first(),
        perms=["can_validate_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": event.application.pk}


def test_unit_group_admin_can_view_applications_for_other_unit_groups(graphql):
    # given:
    # - There is an application event in an application with an event reservation unit
    # - A unit group admin for some other unit group is using the system
    ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__unit_groups__name="foo",
    )
    admin = UserFactory.create_with_unit_group_permissions(
        unit_group=UnitGroupFactory.create(name="bar"),
        perms=["can_validate_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, but is empty
    assert response.has_errors is False, response
    assert response.edges == []


@pytest.mark.parametrize("perms", ["can_handle_applications", "can_validate_applications"])
def test_general_admin_can_view_applications(graphql, perms):
    # given:
    # - There is an application in the system
    # - The general admin is using the system
    application = ApplicationFactory.create_in_status_draft()
    admin = UserFactory.create_with_general_permissions(perms=[perms])
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications
    response = graphql(applications_query())

    # then:
    # - The response has no errors, and contains the application
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": application.pk}


def test_application_user_cannot_see_own_application_working_memo(graphql):
    # given:
    # - There is an application in the system
    # - The application user is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to search for applications working memo
    response = graphql(applications_query(fields="workingMemo"))

    # then:
    # - The response complains about permissions to working memo.
    assert response.error_message("workingMemo") == "You do not have permission to access this field."


def test_service_sector_admin_can_see_working_memo(graphql):
    # given:
    # - There is an application in the system
    # - A service sector admin is using the system
    application = ApplicationFactory.create_in_status_draft()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications working memo
    response = graphql(applications_query(fields="workingMemo"))

    # then:
    # - The response has no errors
    assert response.has_errors is False, response


def test_unit_admin_can_see_working_memo(graphql):
    # given:
    # - There is an application event in an application with an event reservation unit
    # - A unit admin for that unit is using the system
    event = ApplicationEventFactory.create_in_status_unallocated(
        event_reservation_units__reservation_unit__unit__name="foo",
    )
    event_reservation_unit: EventReservationUnit = event.event_reservation_units.first()
    admin = UserFactory.create_with_unit_permissions(
        unit=event_reservation_unit.reservation_unit.unit,
        perms=["can_validate_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to search for applications working memo
    response = graphql(applications_query(fields="workingMemo"))

    # then:
    # - The response has no errors
    assert response.has_errors is False, response
