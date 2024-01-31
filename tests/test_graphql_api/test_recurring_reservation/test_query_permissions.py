import pytest

from tests.factories import RecurringReservationFactory, ServiceSectorFactory, UnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_recurring_reservations__anonymous_user_cannot_see_anything(graphql):
    # given:
    # - There are two recurring reservations in the system
    # - An anonymous user is using the system
    RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - The user queries for recurring reservations
    response = graphql(recurring_reservations_query())

    # then:
    # - The user gets an error about permissions
    assert response.error_message() == "You do not have permission to access this node."


def test_recurring_reservations__regular_user_can_only_see_own_recurring_reservations(graphql):
    # given:
    # - There is a regular user in the system
    # - There are two recurring reservations in the system, one of which belongs to the aforementioned user
    # - The aforementioned user is using the system
    user = UserFactory.create()
    recurring = RecurringReservationFactory.create(user=user)
    RecurringReservationFactory.create()
    graphql.force_login(user)

    # when:
    # - The user queries for recurring reservations
    response = graphql(recurring_reservations_query())

    # then:
    # - The query is successful
    # - The response contains only the recurring reservation that belongs to the user
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__general_admin_can_see_other_user_recurring_reservation(graphql):
    # given:
    # - There are two recurring reservations in the system
    # - A general admin is using the system
    RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_view_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user queries for recurring reservations
    response = graphql(recurring_reservations_query())

    # then:
    # - The query is successful
    # - The response contains all recurring reservations
    assert response.has_errors is False, response
    assert len(response.edges) == 2


def test_recurring_reservations__unit_admin_can_see_other_user_recurring_reservation_for_own_unit(graphql):
    # given:
    # - There are two recurring reservations for different units in the system
    # - A unit admin for one of those units is using the system
    unit_1 = UnitFactory.create()
    unit_2 = UnitFactory.create()
    recurring = RecurringReservationFactory.create(reservation_unit__unit=unit_1)
    RecurringReservationFactory.create(reservation_unit__unit=unit_2)
    admin = UserFactory.create_with_unit_permissions(unit_1, perms=["can_view_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user queries for recurring reservations
    response = graphql(recurring_reservations_query())

    # then:
    # - The query is successful
    # - The response contains only the recurring reservation for the admin's unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring.pk}


def test_recurring_reservations__service_sector_admin_can_see_other_user_recurring_reservation_for_own_sector(graphql):
    # given:
    # - There are two recurring reservations for different service sectors in the system
    # - A service sector admin for one of those sectors is using the system
    sector_1 = ServiceSectorFactory.create()
    sector_2 = ServiceSectorFactory.create()
    recurring = RecurringReservationFactory.create(reservation_unit__unit__service_sectors=[sector_1])
    RecurringReservationFactory.create(reservation_unit__unit__service_sectors=[sector_2])
    admin = UserFactory.create_with_service_sector_permissions(sector_1, perms=["can_view_reservations"])
    graphql.force_login(admin)

    # when:
    # - The user queries for recurring reservations
    response = graphql(recurring_reservations_query())

    # then:
    # - The query is successful
    # - The response contains only the recurring reservation for the admin's service sector
    assert response.has_errors is False, response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring.pk}
