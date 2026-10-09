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
    series = ReservationSeriesFactory.create(name="Old name")

    data = {"pk": series.id, "name": "New name"}
    graphql.login_user_with_role(role=role)
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission

    series.refresh_from_db()
    assert series.name == ("New name" if has_permission else "Old name")


def test_reservation_series__update_series__general_reserver__own_reservation(graphql):
    user = UserFactory.create()
    series = ReservationSeriesFactory.create(user=user, name="Old name")
    GeneralRoleFactory.create(user=user, role=UserRoleChoice.RESERVER)

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user=user)
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    series.refresh_from_db()
    assert series.name == "New name"


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
    series = ReservationSeriesFactory.create(name="Old name")
    user = UserFactory.create_with_unit_role(role=role, units=[series.reservation_unit.unit])

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user)
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is not has_permission

    series.refresh_from_db()
    assert series.name == ("New name" if has_permission else "Old name")


def test_reservation_series__update_series__unit_reserver__own_reservation(graphql):
    user = UserFactory.create()
    series = ReservationSeriesFactory.create(user=user, name="Old name")
    UnitRoleFactory.create(user=user, role=UserRoleChoice.RESERVER, units=[series.reservation_unit.unit])

    data = {"pk": series.id, "name": "New name"}
    graphql.force_login(user)
    response = graphql(UPDATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    series.refresh_from_db()
    assert series.name == "New name"
