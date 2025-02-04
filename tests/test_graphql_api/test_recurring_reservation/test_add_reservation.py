from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from .helpers import ADD_RESERVATION_TO_SERIES_MUTATION, create_reservation_series, get_minimal_add_data

pytestmark = [
    pytest.mark.django_db,
]


@freeze_time(local_datetime(2024, 1, 1))
def test_recurring_reservations__add_reservation(graphql):
    recurring_reservation = create_reservation_series()

    assert recurring_reservation.reservations.count() == 9

    data = get_minimal_add_data(recurring_reservation)

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert recurring_reservation.reservations.count() == 10


@freeze_time(local_datetime(2024, 1, 1))
def test_recurring_reservations__add_reservation__overlapping(graphql):
    recurring_reservation = create_reservation_series()

    assert recurring_reservation.reservations.count() == 9

    data = get_minimal_add_data(
        recurring_reservation,
        begin=datetime.datetime(2024, 1, 1, 10, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        end=datetime.datetime(2024, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    assert recurring_reservation.reservations.count() == 9


@freeze_time(local_datetime(2024, 1, 1))
def test_recurring_reservations__add_reservation__begin_after_end(graphql):
    recurring_reservation = create_reservation_series()

    assert recurring_reservation.reservations.count() == 9

    data = get_minimal_add_data(
        recurring_reservation,
        begin=datetime.datetime(2024, 1, 2, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        end=datetime.datetime(2024, 1, 2, 10, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot end before it begins"]

    assert recurring_reservation.reservations.count() == 9


# TODO: More testing
