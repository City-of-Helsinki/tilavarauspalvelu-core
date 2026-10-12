from __future__ import annotations

import datetime
from contextlib import contextmanager
from typing import TYPE_CHECKING, Any
from unittest import mock

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import (
    AccessType,
    OrderStatus,
    ReservationCancelReasonChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import delete_pindora_reservation_task, handle_unfinished_reservations_task
from utils.date_utils import local_datetime

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory
from tests.helpers import patch_method

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import NonCallableMock

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@contextmanager
def mock_delete_pindora_reservation_task() -> Generator[NonCallableMock]:
    path = "tilavarauspalvelu.models.reservation.queryset."
    path += delete_pindora_reservation_task.__name__
    path += ".delay"

    with mock.patch(path) as task:
        yield task


# ── Free ──


def test_handle_unfinished_reservations__direct__free(settings):
    settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20

    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        state=ReservationStateChoice.CREATED,
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False


def test_handle_unfinished_reservations__direct__free__do_not_delete_too_early(settings):
    settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20

    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=19),
        state=ReservationStateChoice.CREATED,
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is True


# Five minutes after the clocks moved from 03:00 to 04:00 local time.
@freeze_time("2026-03-29 01:05:00+00:00")
def test_handle_unfinished_reservations__direct__free__do_not_delete_too_early__after_daylight_saving_time_change(
    settings,
):
    settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20

    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CREATED,
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is True


@patch_method(PindoraClient.delete_reservation)
def test_handle_unfinished_reservations__direct__free__delete_from_pindora(settings):
    settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20

    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        state=ReservationStateChoice.CREATED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True


@patch_method(PindoraClient.delete_reservation, side_effect=PindoraAPIError())
def test_handle_unfinished_reservations__direct__free__delete_from_pindora__call_fails_runs_task(settings):
    settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20

    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        state=ReservationStateChoice.CREATED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
    )

    with mock_delete_pindora_reservation_task() as task:
        handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True
    assert task.called is True


def test_handle_unfinished_reservations__direct__free__delete_from_pindora_after_deleting_reservations(settings):
    settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES = 20

    first_reservation = ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        begins_at=local_datetime() + datetime.timedelta(days=1),
        ends_at=local_datetime() + datetime.timedelta(days=1, hours=1),
        state=ReservationStateChoice.CREATED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
    )
    second_reservation = ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        begins_at=local_datetime() + datetime.timedelta(days=2),
        ends_at=local_datetime() + datetime.timedelta(days=2, hours=1),
        state=ReservationStateChoice.CREATED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
    )

    reservations_left_at_pindora_calls: list[bool] = []

    def check_reservations_left(**kwargs: Any) -> None:
        reservations_exist = Reservation.objects.exists()
        reservations_left_at_pindora_calls.append(reservations_exist)

    with patch_method(PindoraClient.delete_reservation, side_effect=check_reservations_left):
        handle_unfinished_reservations_task()

        called_uuids = {call.kwargs["reservation"] for call in PindoraClient.delete_reservation.call_args_list}

    assert Reservation.objects.exists() is False
    assert reservations_left_at_pindora_calls == [False, False]
    assert called_uuids == {first_reservation.ext_uuid, second_reservation.ext_uuid}


# ── Paid directly ──


def test_handle_unfinished_reservations__direct__waiting_for_payment__expired(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        status=OrderStatus.EXPIRED,
        created_at=local_datetime() - datetime.timedelta(minutes=5),
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False


def test_handle_unfinished_reservations__direct__waiting_for_payment__cancelled(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        status=OrderStatus.CANCELLED,
        created_at=local_datetime() - datetime.timedelta(minutes=5),
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False


def test_handle_unfinished_reservations__direct__waiting_for_payment__dont_delete_too_early(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        status=OrderStatus.EXPIRED,
        created_at=local_datetime() - datetime.timedelta(minutes=4),
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is True


def test_handle_unfinished_reservations__direct__waiting_for_payment__paid(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        status=OrderStatus.PAID,
        created_at=local_datetime() - datetime.timedelta(minutes=5),
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is True


def test_handle_unfinished_reservations__direct__waiting_for_payment__no_remote_id(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        status=OrderStatus.EXPIRED,
        created_at=local_datetime() - datetime.timedelta(minutes=5),
        remote_id=None,
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is True


def test_handle_unfinished_reservations__direct__waiting_for_payment__no_payment():
    ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is True


@patch_method(PindoraClient.delete_reservation)
def test_handle_unfinished_reservations__direct__waiting_for_payment__delete_from_pindora():
    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        reservation__access_type=AccessType.ACCESS_CODE,
        reservation__access_code_generated_at=local_datetime(),
        status=OrderStatus.EXPIRED,
        created_at=local_datetime() - datetime.timedelta(minutes=5),
    )

    handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True


@patch_method(PindoraClient.delete_reservation, side_effect=PindoraAPIError())
def test_handle_unfinished_reservations__direct__waiting_for_payment__delete_from_pindora__call_fails_runs_task():
    PaymentOrderFactory.create_at(
        reservation__state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        reservation__access_type=AccessType.ACCESS_CODE,
        reservation__access_code_generated_at=local_datetime(),
        status=OrderStatus.EXPIRED,
        created_at=local_datetime() - datetime.timedelta(minutes=5),
    )

    with mock_delete_pindora_reservation_task() as task:
        handle_unfinished_reservations_task()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True
    assert task.called is True


# ── Paid after handling ──


@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_cancelled_email)
def test_handle_unfinished_reservations__handled__overdue():
    reservation_unit = ReservationUnitFactory.create()

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 2, 12),
        type=ReservationTypeChoice.NORMAL,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=reservation_unit,
    )

    PaymentOrderFactory.create(
        reservation=reservation,
        status=OrderStatus.CANCELLED,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
    )

    handle_unfinished_reservations_task()

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED
    assert reservation.cancel_reason == ReservationCancelReasonChoice.NOT_PAID

    assert EmailService.send_reservation_cancelled_email.called is True


@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(EmailService.send_reservation_cancelled_email)
def test_handle_unfinished_reservations__handled__overdue__dont_delete_too_early():
    reservation_unit = ReservationUnitFactory.create()

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 2, 12),
        type=ReservationTypeChoice.NORMAL,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=reservation_unit,
    )

    PaymentOrderFactory.create(
        reservation=reservation,
        status=OrderStatus.CANCELLED,
        handled_payment_due_by=local_datetime(2024, 1, 1, 12),
    )

    handle_unfinished_reservations_task()

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    assert reservation.cancel_reason is None

    assert EmailService.send_reservation_cancelled_email.called is False


@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(PindoraClient.delete_reservation)
def test_handle_unfinished_reservations__handled__overdue__delete_from_pindora():
    reservation_unit = ReservationUnitFactory.create()

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 2, 12),
        type=ReservationTypeChoice.NORMAL,
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        reservation_unit=reservation_unit,
    )

    PaymentOrderFactory.create(
        reservation=reservation,
        status=OrderStatus.CANCELLED,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
    )

    handle_unfinished_reservations_task()

    assert PindoraClient.delete_reservation.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED
    assert reservation.cancel_reason == ReservationCancelReasonChoice.NOT_PAID


@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(PindoraClient.delete_reservation, side_effect=PindoraAPIError())
def test_handle_unfinished_reservations__handled__overdue__delete_from_pindora__call_fails_runs_task():
    reservation_unit = ReservationUnitFactory.create()

    reservation = ReservationFactory.create(
        begins_at=local_datetime(2024, 1, 2, 12),
        type=ReservationTypeChoice.NORMAL,
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        reservation_unit=reservation_unit,
    )

    PaymentOrderFactory.create(
        reservation=reservation,
        status=OrderStatus.CANCELLED,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
    )

    with mock_delete_pindora_reservation_task() as task:
        handle_unfinished_reservations_task()

    assert PindoraClient.delete_reservation.called is True
    assert task.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED
    assert reservation.cancel_reason == ReservationCancelReasonChoice.NOT_PAID
