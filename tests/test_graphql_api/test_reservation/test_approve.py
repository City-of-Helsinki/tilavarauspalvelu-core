import datetime

import pytest

from common.date_utils import next_hour
from email_notification.models import EmailType
from permissions.enums import UserRoleChoice
from reservations.enums import ReservationStateChoice
from tests.factories import EmailTemplateFactory, ReservationFactory, ReservationUnitFactory, UserFactory
from users.models import ReservationNotification

from .helpers import APPROVE_MUTATION, get_approve_data

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__approve__superuser_can_approve(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    begin = next_hour()
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
        begin=begin,
        end=end,
    )

    # A unit admin that will receive a notification about new reservations
    UserFactory.create_with_unit_role(
        units=[reservation_unit.unit],
        reservation_notification=ReservationNotification.ALL,
    )

    EmailTemplateFactory.create(
        type=EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
        subject="approved",
    )
    EmailTemplateFactory.create(
        type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
        subject="staff reservation made",
    )

    graphql.login_with_superuser()
    data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    assert reservation.handled_at is not None

    assert len(outbox) == 2
    assert outbox[0].subject == "approved"
    assert outbox[1].subject == "staff reservation made"


def test_reservation__approve__regular_user_cannot_approve(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_regular_user()
    input_data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


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


def test_reservation__approve__fails_when_price_net_missing(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    input_data = get_approve_data(reservation)
    input_data.pop("priceNet")
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


def test_reservation__approve__unit_reserver_can_approve_own_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
        user=UserFactory.create_with_unit_role(units=[reservation_unit.unit]),
    )

    graphql.force_login(reservation.user)

    input_data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__approve__unit_reserver_cant_approve_other_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit=[reservation_unit],
    )

    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit], role=UserRoleChoice.RESERVER)

    graphql.force_login(admin)

    input_data = get_approve_data(reservation)
    response = graphql(APPROVE_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."
