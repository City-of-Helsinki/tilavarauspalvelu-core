from __future__ import annotations

import pytest
from freezegun import freeze_time

from utils.date_utils import local_datetime

from tests.factories import UserFactory
from tests.test_graphql_api.test_reservation_series.helpers import (
    ADD_RESERVATION_TO_SERIES_MUTATION,
    create_reservation_series,
    get_minimal_add_data,
)

pytestmark = [
    pytest.mark.django_db,
]


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation_series__regular_user(graphql):
    reservation_series = create_reservation_series()

    assert reservation_series.reservations.count() == 9

    data = get_minimal_add_data(reservation_series)

    graphql.login_with_regular_user()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation_series__unit_admin(graphql):
    reservation_series = create_reservation_series()

    assert reservation_series.reservations.count() == 9

    data = get_minimal_add_data(reservation_series)

    user = UserFactory.create_with_unit_role(units=[reservation_series.reservation_unit.unit])

    graphql.force_login(user)
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert reservation_series.reservations.count() == 10


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation_series__general_admin(graphql):
    reservation_series = create_reservation_series()

    assert reservation_series.reservations.count() == 9

    data = get_minimal_add_data(reservation_series)

    user = UserFactory.create_with_general_role()

    graphql.force_login(user)
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert reservation_series.reservations.count() == 10
