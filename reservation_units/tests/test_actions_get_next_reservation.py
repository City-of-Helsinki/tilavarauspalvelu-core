from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit
    from spaces.models import Space

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
        reservation_unit=[reservation_unit],
        type=ReservationTypeChoice.BLOCKED,
        state=ReservationStateChoice.CONFIRMED,
    )
    reservation = ReservationFactory.create(
        begin=(now + timedelta(hours=2)),
        end=(now + timedelta(hours=3)),
        reservation_unit=[reservation_unit],
        state=ReservationStateChoice.CONFIRMED,
    )

    next_reservation = reservation_unit.actions.get_next_reservation(now)
    assert next_reservation is not None
    assert next_reservation.name == reservation_blocked.name

    # Ignores given reservation
    next_reservation = reservation_unit.actions.get_next_reservation(now, reservation=reservation_blocked)
    assert next_reservation is not None
    assert next_reservation.name == reservation.name

    # Ignores blocked reservations
    next_reservation = reservation_unit.actions.get_next_reservation(now, exclude_blocked=True)
    assert next_reservation is not None
    assert next_reservation.name == reservation.name
