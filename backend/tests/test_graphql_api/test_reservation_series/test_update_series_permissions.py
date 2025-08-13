from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import UserRoleChoice

from tests.factories import GeneralRoleFactory, ReservationSeriesFactory, UnitRoleFactory, UserFactory

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
        (UserRoleChoice.RESERVER, False),
        (UserRoleChoice.NOTIFICATION_MANAGER, False),
    ],
)
def test_reservation_series__update_series__general_admin(graphql, role, has_permission):
    series = ReservationSeriesFactory.create()

    data = {"pk": series.id, "name": "New name"}
    user = UserFactory.create_with_general_role(role=role)
    graphql.force_login(user)

    response = graphql(UPDATE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is not has_permission


def test_reservation_series__update_series__general_reserver__own_reservation(graphql):
    user = UserFactory.create()
    series = ReservationSeriesFactory.create(user=user)
    GeneralRoleFactory.create(user=user, role=UserRoleChoice.RESERVER)

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user=user)
    response = graphql(UPDATE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False


@pytest.mark.parametrize(
    ("role", "has_permission"),
    [
        (UserRoleChoice.ADMIN, True),
        (UserRoleChoice.HANDLER, True),
        (UserRoleChoice.VIEWER, False),
        (UserRoleChoice.RESERVER, False),
        (UserRoleChoice.NOTIFICATION_MANAGER, False),
    ],
)
def test_reservation_series__update_series__unit_admin(graphql, role, has_permission):
    series = ReservationSeriesFactory.create()
    user = UserFactory.create_with_unit_role(role=role, units=[series.reservation_unit.unit])

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user)
    response = graphql(UPDATE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is not has_permission


def test_reservation_series__update_series__unit_reserver__own_reservation(graphql):
    user = UserFactory.create()
    series = ReservationSeriesFactory.create(user=user)
    UnitRoleFactory.create(user=user, role=UserRoleChoice.RESERVER, units=[series.reservation_unit.unit])

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user)
    response = graphql(UPDATE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False
