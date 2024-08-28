import pytest

from reservations.enums import ReservationStateChoice
from tests.factories import ReservationFactory, ReservationUnitFactory

from .helpers import APPROVE_MUTATION, get_approve_data

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__approve__cant_approve_if_status_not_requires_handling(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CREATED,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Only reservations with state 'REQUIRES_HANDLING' can be approved.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__approve__approving_fails_when_price_missing(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("price")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__approve__fails_when_handling_details_missing(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("handlingDetails")
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__approve__succeeds_with_empty_handling_details(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    data["handlingDetails"] = ""
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
