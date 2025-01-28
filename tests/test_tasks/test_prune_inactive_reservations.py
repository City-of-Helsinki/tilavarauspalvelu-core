from __future__ import annotations

import datetime
from unittest import mock

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.services.pruning import prune_inactive_reservations
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_inactive_reservations__deletes_old_reservations_with_state_created():
    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        state=ReservationStateChoice.CREATED,
    )

    prune_inactive_reservations()

    assert Reservation.objects.exists() is False


def test_prune_inactive_reservations__does_not_delete_inactive_reservations_with_state():
    twenty_minutes_ago = local_datetime() - datetime.timedelta(minutes=20)

    for state, _ in ReservationStateChoice.choices:
        if state == ReservationStateChoice.CREATED:
            continue
        ReservationFactory.create(created_at=twenty_minutes_ago, state=state)

    prune_inactive_reservations()

    assert Reservation.objects.count() == len(ReservationStateChoice.choices) - 1


def test_prune_inactive_reservations__does_not_delete_recent_reservations():
    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=19),
        state=ReservationStateChoice.CREATED,
    )

    prune_inactive_reservations()

    assert Reservation.objects.exists() is True


@patch_method(PindoraClient.delete_reservation)
def test_prune_inactive_reservations__delete_from_pindora():
    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        state=ReservationStateChoice.CREATED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
    )

    prune_inactive_reservations()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True


@patch_method(PindoraClient.delete_reservation, side_effect=PindoraAPIError())
def test_prune_inactive_reservations__delete_from_pindora__call_fails_runs_task():
    ReservationFactory.create(
        created_at=local_datetime() - datetime.timedelta(minutes=20),
        state=ReservationStateChoice.CREATED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
    )

    path = "tilavarauspalvelu.services.pruning.delete_pindora_reservation.delay"

    with mock.patch(path) as task:
        prune_inactive_reservations()

    assert Reservation.objects.exists() is False

    assert PindoraClient.delete_reservation.called is True
    assert task.called is True
