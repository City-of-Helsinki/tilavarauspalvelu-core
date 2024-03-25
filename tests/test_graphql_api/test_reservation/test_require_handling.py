import pytest

from email_notification.models import EmailType
from reservations.choices import ReservationStateChoice
from tests.factories import EmailTemplateFactory, ReservationFactory, UnitFactory, UserFactory
from users.models import ReservationNotification

from .helpers import REQUIRE_HANDLING_MUTATION, get_require_handling_data

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_celery_synchronous"),
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
    UserFactory.create_with_unit_permissions(
        unit=reservation.reservation_unit.first().unit,
        perms=["can_manage_reservations"],
        reservation_notification=ReservationNotification.ALL,
    )

    template = EmailTemplateFactory(
        type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
        subject="staff requires handling",
    )

    graphql.login_with_superuser()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING

    assert len(outbox) == 1
    assert outbox[0].subject == template.subject


def test_reservation__handling_required__regular_user(graphql):
    reservation = ReservationFactory.create_for_handling_required()

    graphql.login_with_regular_user()
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.state != ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__handling_required__unit_reserver__own_reservation(graphql):
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(
        unit=unit,
        perms=["can_create_staff_reservations"],
        code="foo",
    )
    reservation = ReservationFactory.create_for_handling_required(user=admin, reservation_unit__unit=unit)

    graphql.force_login(admin)
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__handling_required__unit_reserver__other_user_reservation(graphql):
    unit = UnitFactory.create()
    admin = UserFactory.create_with_unit_permissions(
        unit=unit,
        perms=["can_create_staff_reservations"],
        code="foo",
    )
    reservation = ReservationFactory.create_for_handling_required(reservation_unit__unit=unit)

    graphql.force_login(admin)
    input_data = get_require_handling_data(reservation)
    response = graphql(REQUIRE_HANDLING_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.state != ReservationStateChoice.REQUIRES_HANDLING
