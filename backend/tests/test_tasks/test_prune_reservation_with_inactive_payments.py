from __future__ import annotations

import datetime
import uuid
from unittest import mock

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime

from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_reservation_with_inactive_payments__deletes():
    with freeze_time(local_datetime() - datetime.timedelta(minutes=5)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            remote_id=uuid.uuid4(),
            status=OrderStatus.CANCELLED,
        )

    Reservation.objects.delete_with_inactive_payments()

    assert not Reservation.objects.exists()


def test_prune_reservation_with_inactive_payments__reservations_with_fresh_payments_are_not_deleted():
    now = local_datetime()

    with freeze_time(now - datetime.timedelta(minutes=4)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            remote_id=uuid.uuid4(),
            status=OrderStatus.CANCELLED,
        )

    PaymentOrderFactory.create(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        remote_id=uuid.uuid4(),
        status=OrderStatus.CANCELLED,
    )

    Reservation.objects.delete_with_inactive_payments()

    assert Reservation.objects.count() == 2


def test_prune_reservation_with_inactive_payments__reservations_with_other_states_are_not_deleted():
    with freeze_time(local_datetime() - datetime.timedelta(minutes=5)):
        for state, _ in ReservationStateChoice.choices:
            if state == ReservationStateChoice.WAITING_FOR_PAYMENT:
                continue
            PaymentOrderFactory.create(reservation__state=state, remote_id=uuid.uuid4(), status=OrderStatus.CANCELLED)

    Reservation.objects.delete_with_inactive_payments()
    assert Reservation.objects.count() == len(ReservationStateChoice.choices) - 1


def test_prune_reservation_with_inactive_payments__reservations_without_remote_id_are_not_deleted():
    with freeze_time(local_datetime() - datetime.timedelta(minutes=5)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            status=OrderStatus.CANCELLED,
            remote_id=None,
        )

    Reservation.objects.delete_with_inactive_payments()

    assert Reservation.objects.exists() is True


def test_prune_reservation_with_inactive_payments__does_not_delete_reservations_without_order():
    ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    Reservation.objects.delete_with_inactive_payments()

    assert Reservation.objects.exists() is True


@patch_method(PindoraClient.delete_reservation)
def test_prune_reservation_with_inactive_payments__delete_from_pindora():
    with freeze_time(local_datetime() - datetime.timedelta(minutes=5)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            reservation__access_type=AccessType.ACCESS_CODE,
            reservation__access_code_generated_at=local_datetime(),
            remote_id=uuid.uuid4(),
            status=OrderStatus.CANCELLED,
        )

    Reservation.objects.delete_with_inactive_payments()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True


@patch_method(PindoraClient.delete_reservation, side_effect=PindoraAPIError())
def test_prune_reservation_with_inactive_payments__delete_from_pindora__call_fails_runs_task():
    with freeze_time(local_datetime() - datetime.timedelta(minutes=5)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            reservation__access_type=AccessType.ACCESS_CODE,
            reservation__access_code_generated_at=local_datetime(),
            remote_id=uuid.uuid4(),
            status=OrderStatus.CANCELLED,
        )

    path = "tilavarauspalvelu.models.reservation.queryset.delete_pindora_reservation.delay"

    with mock.patch(path) as task:
        Reservation.objects.delete_with_inactive_payments()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True
    assert task.called is True
