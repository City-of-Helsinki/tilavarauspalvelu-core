from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import UserRoleChoice
from utils.date_utils import local_datetime

from tests.factories import ReservationDenyReasonFactory, UnitRoleFactory, UserFactory

from .helpers import DENY_SERIES_MUTATION, create_reservation_series

pytestmark = [
    pytest.mark.django_db,
]


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__regular_user(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    graphql.login_with_regular_user()

    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__general_admin(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    graphql.login_user_with_role(role=UserRoleChoice.ADMIN)

    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__unit_admin(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    unit = reservation_series.reservation_unit.unit
    user = UserFactory.create_with_unit_role(role=UserRoleChoice.ADMIN, units=[unit])
    graphql.force_login(user)

    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__unit_handler(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    unit = reservation_series.reservation_unit.unit
    user = UserFactory.create_with_unit_role(role=UserRoleChoice.HANDLER, units=[unit])
    graphql.force_login(user)

    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__unit_reserver__own_reservation(graphql):
    reason = ReservationDenyReasonFactory.create()

    user = UserFactory.create()

    reservation_series = create_reservation_series(user=user)

    unit = reservation_series.reservation_unit.unit
    UnitRoleFactory.create(user=user, role=UserRoleChoice.RESERVER, units=[unit])

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    graphql.force_login(user)

    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__unit_reserver__other_user_reservation(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    unit = reservation_series.reservation_unit.unit
    user = UserFactory.create_with_unit_role(role=UserRoleChoice.RESERVER, units=[unit])
    graphql.force_login(user)

    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
