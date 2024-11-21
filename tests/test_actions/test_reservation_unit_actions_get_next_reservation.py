from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import ReservationUnitHierarchy

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit, Space

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

NOW = datetime(2023, 5, 25, 12, 23, 0, tzinfo=UTC)


@freeze_time(NOW)
def test_reservation_unit__get_next_reservation():
    space: Space = SpaceFactory.create()
    reservation_unit: ReservationUnit = ReservationUnitFactory.create(spaces=[space])
    now = datetime.now(tz=UTC)
    reservation_blocked = ReservationFactory.create(
        begin=(now + timedelta(hours=1)),
        end=(now + timedelta(hours=2)),
        reservation_units=[reservation_unit],
        type=ReservationTypeChoice.BLOCKED,
        state=ReservationStateChoice.CONFIRMED,
    )
    reservation = ReservationFactory.create(
        begin=(now + timedelta(hours=2)),
        end=(now + timedelta(hours=3)),
        reservation_units=[reservation_unit],
        state=ReservationStateChoice.CONFIRMED,
    )

    ReservationUnitHierarchy.refresh()

    next_reservation = reservation_unit.actions.get_next_reservation(end_time=now)
    assert next_reservation is not None
    assert next_reservation.name == reservation_blocked.name

    # Ignores given reservation
    next_reservation = reservation_unit.actions.get_next_reservation(end_time=now, reservation=reservation_blocked)
    assert next_reservation is not None
    assert next_reservation.name == reservation.name

    # Ignores blocked reservations
    next_reservation = reservation_unit.actions.get_next_reservation(end_time=now, exclude_blocked=True)
    assert next_reservation is not None
    assert next_reservation.name == reservation.name
