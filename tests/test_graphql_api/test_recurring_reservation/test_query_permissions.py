import pytest

from tests.factories import RecurringReservationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import UserType

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__query__regular_user__can_only_see_own(graphql):
    user = graphql.login_user_based_on_type(UserType.REGULAR)

    recurring_reservation = RecurringReservationFactory.create(user=user)
    RecurringReservationFactory.create()

    query = recurring_reservations_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__query__general_admin__can_see_all(graphql):
    user = UserFactory.create_with_general_permissions(perms=["can_view_reservations"])
    recurring_reservation_1 = RecurringReservationFactory.create(name="1", user=user)
    recurring_reservation_2 = RecurringReservationFactory.create(name="2")

    graphql.force_login(user)

    query = recurring_reservations_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__query__unit_admin__can_only_see_in_own_unit_from_others(graphql):
    reservation_unit = ReservationUnitFactory.create()

    user = UserFactory.create_with_unit_permissions(unit=reservation_unit.unit, perms=["can_view_reservations"])
    recurring_reservation_1 = RecurringReservationFactory.create(name="1", user=user)
    recurring_reservation_2 = RecurringReservationFactory.create(name="2", reservation_unit=reservation_unit)
    RecurringReservationFactory.create()

    graphql.force_login(user)

    query = recurring_reservations_query()
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}
