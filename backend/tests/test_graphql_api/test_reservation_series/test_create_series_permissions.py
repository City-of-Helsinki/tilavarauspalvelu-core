from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import ReservationUnitFactory, UserFactory

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
def test_reservation_series__create_series__general_role(graphql, role, has_permission):
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create_with_general_role(role=role)
    graphql.force_login(user)

    data = get_minimal_series_data(reservation_unit, user)
    response = graphql(CREATE_SERIES_MUTATION, variables={"input": data})

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
def test_reservation_series__create_series__unit_role(graphql, role, has_permission):
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create_with_unit_role(role=role, units=[reservation_unit.unit])

    graphql.force_login(user)
    data = get_minimal_series_data(reservation_unit, user)
    response = graphql(CREATE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is not has_permission
