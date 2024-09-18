import uuid
from datetime import timedelta

import pytest
from freezegun import freeze_time

from common.date_utils import local_datetime
from reservations.enums import ReservationStateChoice
from reservations.models import Reservation
from reservations.pruning import prune_reservation_with_inactive_payments
from tests.factories import PaymentOrderFactory, ReservationFactory
from tilavarauspalvelu.enums import OrderStatus

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_reservation_with_inactive_payments__deletes():
    with freeze_time(local_datetime() - timedelta(minutes=5)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            remote_id=uuid.uuid4(),
            status=OrderStatus.CANCELLED,
        )

    prune_reservation_with_inactive_payments()

    assert not Reservation.objects.exists()


def test_prune_reservation_with_inactive_payments__reservations_with_fresh_payments_are_not_deleted():
    now = local_datetime()

    with freeze_time(now - timedelta(minutes=4)):
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

    prune_reservation_with_inactive_payments()

    assert Reservation.objects.count() == 2


def test_prune_reservation_with_inactive_payments__reservations_with_other_states_are_not_deleted():
    with freeze_time(local_datetime() - timedelta(minutes=5)):
        for state, _ in ReservationStateChoice.choices:
            if state == ReservationStateChoice.WAITING_FOR_PAYMENT:
                continue
            PaymentOrderFactory.create(reservation__state=state, remote_id=uuid.uuid4(), status=OrderStatus.CANCELLED)

    prune_reservation_with_inactive_payments()
    assert Reservation.objects.count() == len(ReservationStateChoice.choices) - 1


def test_prune_reservation_with_inactive_payments__reservations_without_remote_id_are_not_deleted():
    with freeze_time(local_datetime() - timedelta(minutes=5)):
        PaymentOrderFactory.create(
            reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            status=OrderStatus.CANCELLED,
            remote_id=None,
        )

    prune_reservation_with_inactive_payments()

    assert Reservation.objects.exists() is True


def test_prune_reservation_with_inactive_payments__does_not_delete_reservations_without_order():
    ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    prune_reservation_with_inactive_payments()

    assert Reservation.objects.exists() is True
