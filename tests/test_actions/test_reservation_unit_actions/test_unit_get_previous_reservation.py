from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import ReservationUnitHierarchy

from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

NOW = datetime.datetime(2023, 5, 25, 12, 23, 0, tzinfo=datetime.UTC)


@freeze_time(NOW)
def test_reservation_unit__get_previous_reservation():
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])
    reservation_blocked = ReservationFactory.create(
        begin=(NOW - datetime.timedelta(hours=2)),
        end=(NOW - datetime.timedelta(hours=1)),
        reservation_units=[reservation_unit],
        type=ReservationTypeChoice.BLOCKED,
        state=ReservationStateChoice.CONFIRMED,
    )
    reservation = ReservationFactory.create(
        begin=(NOW - datetime.timedelta(hours=3)),
        end=(NOW - datetime.timedelta(hours=2)),
        reservation_units=[reservation_unit],
        state=ReservationStateChoice.CONFIRMED,
    )

    ReservationUnitHierarchy.refresh()

    previous_reservation = reservation_unit.actions.get_previous_reservation(start_time=NOW)
    assert previous_reservation is not None
    assert previous_reservation.name == reservation_blocked.name

    # Ignores given reservation
    previous_reservation = reservation_unit.actions.get_previous_reservation(
        start_time=NOW, reservation=reservation_blocked
    )
    assert previous_reservation is not None
    assert previous_reservation.name == reservation.name

    # Ignores blocked reservations
    previous_reservation = reservation_unit.actions.get_previous_reservation(start_time=NOW, exclude_blocked=True)
    assert previous_reservation is not None
    assert previous_reservation.name == reservation.name
