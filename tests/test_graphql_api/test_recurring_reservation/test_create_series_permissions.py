import pytest

from tests.factories import ReservationUnitFactory, UserFactory
from tilavarauspalvelu.enums import UserRoleChoice

from .helpers import CREATE_SERIES_MUTATION, get_minimal_series_data

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
def test_recurring_reservations__create_series__general_role(graphql, role, has_permission):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_user_with_role(role=role)

    data = get_minimal_series_data(reservation_unit, user)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

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
def test_recurring_reservations__create_series__unit_role(graphql, role, has_permission):
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create_with_unit_role(role=role, units=[reservation_unit.unit])

    graphql.force_login(user)
    data = get_minimal_series_data(reservation_unit, user)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission
