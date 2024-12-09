from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from utils.date_utils import local_datetime

from tests.factories import ReservationDenyReasonFactory
from tests.helpers import patch_method

from .helpers import DENY_SERIES_MUTATION, create_reservation_series

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_seasonal_reservation_rejected_series_email)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
        "handlingDetails": "Handling details",
    }

    graphql.login_with_superuser()
    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"denied": 5, "future": 5}
    assert reservation_series.reservations.count() == 9

    future_reservations = reservation_series.reservations.filter(begin__gt=local_datetime())
    past_reservations = reservation_series.reservations.filter(begin__lte=local_datetime())

    assert all(reservation.state == ReservationStateChoice.DENIED for reservation in future_reservations)
    assert all(reservation.deny_reason == reason for reservation in future_reservations)
    assert all(reservation.handling_details == "Handling details" for reservation in future_reservations)
    assert all(reservation.handled_at == local_datetime() for reservation in future_reservations)

    assert all(reservation.state != ReservationStateChoice.DENIED for reservation in past_reservations)
    assert all(reservation.deny_reason != reason for reservation in past_reservations)
    assert all(reservation.handling_details != "Handling details" for reservation in past_reservations)
    assert all(reservation.handled_at is None for reservation in past_reservations)

    assert EmailService.send_seasonal_reservation_rejected_series_email.called is True


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__dont_need_handling_details(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
    }

    graphql.login_with_superuser()
    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"denied": 5, "future": 5}


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__reason_missing(graphql):
    reservation_series = create_reservation_series()

    data = {
        "pk": reservation_series.pk,
        "denyReason": 1,
        "handlingDetails": "Handling details",
    }

    graphql.login_with_superuser()
    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("denyReason") == ["Deny reason with pk 1 does not exist."]


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__deny_series__only_deny_certain_states(graphql):
    reason = ReservationDenyReasonFactory.create()

    reservation_series = create_reservation_series()

    last_reservation = reservation_series.reservations.order_by("begin").last()
    last_reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
    last_reservation.save()

    data = {
        "pk": reservation_series.pk,
        "denyReason": reason.pk,
        "handlingDetails": "Handling details",
    }

    graphql.login_with_superuser()
    response = graphql(DENY_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    # Last reservation is denied since it's waiting for payment
    assert response.first_query_object == {"denied": 4, "future": 5}
