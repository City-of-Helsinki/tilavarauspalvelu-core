from __future__ import annotations

import datetime

import pytest
from rest_framework.reverse import reverse

from tilavarauspalvelu.api.frontend_testing_api.helpers import unfreeze_at_end
from tilavarauspalvelu.enums import OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.models import PaymentOrder, Reservation, ReservationUnit, ReservationUnitPricing, Unit, User
from utils.date_utils import local_datetime

pytestmark = [
    pytest.mark.django_db,
]


_ENDPOINT = "frontend_testing_api:reservation-list"


def test_frontend_api__reservation__user__general_role(api_client):
    data = {
        "user": {"role": "HANDLER"},
        "params": {},
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    user = User.objects.first()
    assert user.permissions.can_manage_reservation(Reservation.objects.first(), reserver_needs_role=True)
    assert user.permissions.has_general_role(role_choices=["HANDLER"])
    assert not user.permissions.has_role_for_units_or_their_unit_groups(units=Unit.objects.all())


def test_frontend_api__reservation__user__unit_role(api_client):
    data = {
        "user": {"role": "ADMIN", "is_unit_role": True},
        "params": {},
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    user = User.objects.first()
    assert user.permissions.can_manage_reservation(Reservation.objects.first(), reserver_needs_role=True)
    assert not user.permissions.has_general_role()
    assert user.permissions.has_role_for_units_or_their_unit_groups(units=Unit.objects.all())


def test_frontend_api__reservation__user__not_provided_no_auth(api_client):
    data = {
        "params": {},
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    user = User.objects.first()
    reservation = Reservation.objects.first()
    assert user == reservation.user
    assert not user.permissions.can_manage_reservation(reservation, reserver_needs_role=True)
    assert not user.permissions.has_general_role()
    assert not user.permissions.has_role_for_units_or_their_unit_groups(units=Unit.objects.all())


@unfreeze_at_end()
def test_frontend_api__reservation__set_datetime__default_options(api_client):
    data = {
        "current_datetime": "2022-01-01T12:00:00",
        "user": {},
        "params": {},
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    reservation_unit = ReservationUnit.objects.first()
    assert reservation_unit.is_archived is False
    assert reservation_unit.is_draft is False
    assert reservation_unit.require_reservation_handling is False
    assert reservation_unit.cancellation_rule.can_be_cancelled_time_before is None

    reservation = Reservation.objects.first()
    assert reservation.begins_at == local_datetime(2022, 1, 2, 12)
    assert reservation.state == ReservationStateChoice.CONFIRMED
    assert reservation.reservation_series is None

    pricing = ReservationUnitPricing.objects.first()
    assert pricing.highest_price == 0

    assert PaymentOrder.objects.count() == 0


@unfreeze_at_end()
def test_frontend_api__reservation__set_datetime__non_default_options(api_client):
    data = {
        "current_datetime": "2030-01-01T00:00:00",
        "user": {},
        "params": {
            "state": ReservationStateChoice.REQUIRES_HANDLING,
            "is_archived": True,
            "is_draft": True,
            "is_cancellable": True,
            "is_paid_reservation": True,
            "is_paid_on_site": True,
            "is_past": True,
            "is_part_of_series": True,
        },
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    assert ReservationUnit.objects.count() == 1
    reservation_unit = ReservationUnit.objects.first()
    assert reservation_unit.is_archived is True
    assert reservation_unit.is_draft is True
    assert reservation_unit.require_reservation_handling is True
    assert reservation_unit.cancellation_rule.can_be_cancelled_time_before == datetime.timedelta(hours=24)

    assert Reservation.objects.count() == 1
    reservation = Reservation.objects.first()
    assert reservation.begins_at == local_datetime(2029, 12, 31, 00)
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.reservation_series is not None

    assert ReservationUnitPricing.objects.count() == 1
    pricing = ReservationUnitPricing.objects.first()
    assert pricing.highest_price == 10

    assert PaymentOrder.objects.count() == 1
    payment_order = PaymentOrder.objects.first()
    assert payment_order.payment_type == PaymentType.ON_SITE
    assert payment_order.status == OrderStatus.DRAFT


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("state", ReservationStateChoice.WAITING_FOR_PAYMENT),
        ("is_paid_on_site", True),
    ],
)
def test_frontend_api__reservation__invalid_is_paid_reservation_choices(api_client, field, value):
    data = {
        "user": {},
        "params": {
            "is_paid_reservation": False,
            field: value,
        },
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 400, response.json()


@unfreeze_at_end()
def test_frontend_api__reservation__set_datetime__multiple_api_calls(api_client):
    data = {
        "current_datetime": "2022-01-01T12:00:00",
        "params": {},
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    assert local_datetime() == local_datetime(2022, 1, 1, 12)

    assert Reservation.objects.count() == 1
    reservation = Reservation.objects.first()
    assert reservation.begins_at == local_datetime(2022, 1, 2, 12)

    data = {
        "current_datetime": "2030-01-01T12:00:00",
        "params": {},
    }
    response = api_client.post(reverse(_ENDPOINT), data=data, format="json")
    assert response.status_code == 201, response.json()

    assert local_datetime() == local_datetime(2030, 1, 1, 12)

    assert Reservation.objects.count() == 2  # Database is not flushed when running automated tests
    reservation = Reservation.objects.last()
    assert reservation.begins_at == local_datetime(2030, 1, 2, 12)
