import pytest

from tests.factories import EmailTemplateFactory, ReservationFactory, UserFactory
from tilavarauspalvelu.enums import EmailType, ReservationNotification, ReservationStateChoice

from .helpers import REQUIRE_HANDLING_MUTATION, get_require_handling_data

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CONFIRMED,
        ReservationStateChoice.DENIED,
    ],
)
def test_reservation__handling_required__allowed_states(graphql, outbox, settings, state):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    reservation = ReservationFactory.create_for_handling_required(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_unit.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    template = EmailTemplateFactory(
        type=EmailType.RESERVATION_HANDLING_REQUIRED,
        subject="handling required",
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 1
    assert outbox[0].subject == template.subject


@pytest.mark.parametrize(
    "state",
    [
        ReservationStateChoice.CREATED,
        ReservationStateChoice.CANCELLED,
        ReservationStateChoice.REQUIRES_HANDLING,
        ReservationStateChoice.WAITING_FOR_PAYMENT,
    ],
)
def test_reservation__handling_required__disallowed_states(graphql, state):
    reservation = ReservationFactory.create_for_handling_required(state=state)

    # Admin will get notification
    UserFactory.create_with_unit_role(
        units=[reservation.reservation_unit.first().unit],
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
