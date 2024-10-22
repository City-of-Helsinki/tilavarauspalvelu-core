import pytest
from django.test import override_settings

from tests.factories import ReservationFactory, UserFactory
from tilavarauspalvelu.enums import ReservationNotification, ReservationStateChoice

from .helpers import REQUIRE_HANDLING_MUTATION, get_require_handling_data

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CONFIRMED,
        ReservationStateChoice.DENIED,
    ],
)
def test_reservation__requires_handling__allowed_states(graphql, outbox, state):
    reservation = ReservationFactory.create_for_requires_handling(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_units.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 1
    assert outbox[0].subject == "Your booking is waiting for processing"


@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CREATED,
        ReservationStateChoice.CANCELLED,
        ReservationStateChoice.REQUIRES_HANDLING,
        ReservationStateChoice.WAITING_FOR_PAYMENT,
    ],
)
def test_reservation__requires_handling__disallowed_states(graphql, state):
    reservation = ReservationFactory.create_for_requires_handling(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_units.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Only reservations with states 'CONFIRMED' or 'DENIED' can be returned to handling.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == state
