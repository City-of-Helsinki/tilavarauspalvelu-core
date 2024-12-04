from __future__ import annotations

import datetime

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory
from tests.helpers import patch_method

from .helpers import DENY_MUTATION, get_deny_data

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_reservation_rejected_email)
@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL])
def test_reservation__deny__state_is_confirmed(graphql, reservation_type):
    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CONFIRMED, type=reservation_type)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert EmailService.send_reservation_rejected_email.called is True


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


@override_settings(SEND_EMAILS=True)
def test_reservation__deny__send_email(graphql, outbox):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED
    assert reservation.handling_details == "foo"
    assert reservation.handled_at is not None

    assert len(outbox) == 1
    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"


@override_settings(SEND_EMAILS=True)
@pytest.mark.parametrize(
    "reservation_type",
    [
        ReservationTypeChoice.STAFF,
        ReservationTypeChoice.BLOCKED,
        ReservationTypeChoice.BEHALF,
    ],
)
def test_reservation__deny__dont_send_email_for_reservation_type_x(graphql, outbox, reservation_type):
    reservation = ReservationFactory.create_for_deny(type=reservation_type)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_reservation__deny__send_email_if_reservation_started_but_not_ended(graphql, outbox):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour - datetime.timedelta(hours=1)
    end = last_hour + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 1
    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"


@override_settings(SEND_EMAILS=True)
def test_reservation__deny__dont_send_notification_if_reservation_already_ended(graphql, outbox):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 0
