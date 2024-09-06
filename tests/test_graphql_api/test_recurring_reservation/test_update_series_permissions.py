import pytest

from tests.factories import RecurringReservationFactory, UserFactory
from tilavarauspalvelu.enums import UserRoleChoice

from .helpers import UPDATE_SERIES_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    ("role", "has_permission"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, True),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, True),
        (UserRoleChoice.NOTIFICATION_MANAGER, False),
    ],
)
def test_recurring_reservations__update_series__general_admin(graphql, role, has_permission):
    series = RecurringReservationFactory.create()

    data = {"pk": series.id, "name": "New name"}
    graphql.login_user_with_role(role=role)
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission


@pytest.mark.parametrize(
    ("role", "has_permission"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, True),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, True),
        (UserRoleChoice.NOTIFICATION_MANAGER, False),
    ],
)
def test_recurring_reservations__update_series__unit_admin(graphql, role, has_permission):
    series = RecurringReservationFactory.create()
    user = UserFactory.create_with_unit_role(role=role, units=[series.reservation_unit.unit])

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user)
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission
