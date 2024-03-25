import pytest

from tests.factories import RecurringReservationFactory, ServiceSectorFactory, UserFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__update__regular_user(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")
    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_recurring_reservations__update__general_admin(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")

    admin = UserFactory.create_with_general_permissions(
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"


def test_recurring_reservations__update__unit_admin(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")

    admin = UserFactory.create_with_unit_permissions(
        unit=recurring_reservation.reservation_unit.unit,
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"


def test_recurring_reservations__update__service_sector_admin(graphql):
    recurring_reservation = RecurringReservationFactory.create(name="foo")
    sector = ServiceSectorFactory.create(units=[recurring_reservation.reservation_unit.unit])

    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=sector,
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    data = {"pk": recurring_reservation.pk, "name": "bar"}

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation.refresh_from_db()
    assert recurring_reservation.name == "bar"
