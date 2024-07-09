import datetime

import pytest

from common.date_utils import local_datetime
from email_notification.models import EmailType
from reservations.enums import ReservationStateChoice, ReservationTypeChoice
from tests.factories import EmailTemplateFactory, ReservationFactory, UserFactory

from .helpers import DENY_MUTATION, get_deny_data

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__deny__regular_user(graphql):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_regular_user()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__deny__general_admin(graphql):
    reservation = ReservationFactory.create_for_deny()
    admin = UserFactory.create_with_general_permissions(perms=["can_manage_reservations"])

    graphql.force_login(admin)
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__deny__own_reservation_with_reservation_staff_create_permissions(graphql):
    admin = UserFactory.create_with_general_permissions(perms=["can_create_staff_reservations"])
    reservation = ReservationFactory.create_for_deny(user=admin)

    graphql.force_login(admin)
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__deny__state_is_confirmed(graphql):
    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CONFIRMED)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__deny__status_not_allowed_states(graphql):
    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CREATED)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Only reservations with states 'REQUIRES_HANDLING' or 'CONFIRMED' can be denied.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__deny__reason_missing(graphql):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    input_data.pop("denyReason")
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_schema_errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__deny__handling_details_missing(graphql):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    input_data.pop("handlingDetails")
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_schema_errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__deny__state_confirmed_and_reservation_ended(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CONFIRMED, begin=begin, end=end)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation cannot be denied after it has ended.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__deny__state_requires_handling_and_reservation_ended(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__deny__send_email(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    reservation = ReservationFactory.create_for_deny()
    EmailTemplateFactory.create(type=EmailType.RESERVATION_REJECTED, subject="denied")

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED
    assert reservation.handling_details == "foo"
    assert reservation.handled_at is not None

    assert len(outbox) == 1
    assert outbox[0].subject == "denied"


@pytest.mark.parametrize(
    "reservation_type",
    [
        ReservationTypeChoice.STAFF,
        ReservationTypeChoice.BLOCKED,
        ReservationTypeChoice.BEHALF,
    ],
)
def test_reservation__deny__dont_send_email_for_reservation_type_x(graphql, outbox, settings, reservation_type):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    reservation = ReservationFactory.create_for_deny(type=reservation_type)
    EmailTemplateFactory.create(type=EmailType.RESERVATION_REJECTED, subject="denied")

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 0


def test_reservation__deny__send_email_if_reservation_started_but_not_ended(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour - datetime.timedelta(hours=1)
    end = last_hour + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)
    EmailTemplateFactory.create(type=EmailType.RESERVATION_REJECTED, subject="denied")

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 1
    assert outbox[0].subject == "denied"


def test_reservation__deny__dont_send_notification_if_reservation_already_ended(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)
    EmailTemplateFactory.create(type=EmailType.RESERVATION_REJECTED, subject="denied")

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 0
