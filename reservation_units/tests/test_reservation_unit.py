from datetime import UTC, datetime, timedelta

from django.test import TestCase
from freezegun import freeze_time

from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from spaces.models import Space
from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory


@freeze_time("2023-05-25 12:23:00")
class GetPreviousReservationTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.space: Space = SpaceFactory()
        self.reservation_unit: ReservationUnit = ReservationUnitFactory(spaces=[self.space])
        self.now = datetime.now(tz=UTC)
        self.reservation_blocked = ReservationFactory(
            begin=(self.now - timedelta(hours=2)),
            end=(self.now - timedelta(hours=1)),
            reservation_unit=[self.reservation_unit],
            type=ReservationTypeChoice.BLOCKED,
            state=ReservationStateChoice.CONFIRMED,
        )
        self.reservation = ReservationFactory(
            begin=(self.now - timedelta(hours=3)),
            end=(self.now - timedelta(hours=2)),
            reservation_unit=[self.reservation_unit],
            state=ReservationStateChoice.CONFIRMED,
        )

    def test_get_previous_reservation(self):
        previous_reservation = self.reservation_unit.actions.get_previous_reservation(self.now)
        assert previous_reservation is not None
        assert previous_reservation.name == self.reservation_blocked.name

    def test_get_previous_reservation_ignored_given_reservation(self):
        previous_reservation = self.reservation_unit.actions.get_previous_reservation(
            self.now, reservation=self.reservation_blocked
        )
        assert previous_reservation is not None
        assert previous_reservation.name == self.reservation.name

    def test_get_previous_reservation_ignores_blocked(self):
        previous_reservation = self.reservation_unit.actions.get_previous_reservation(self.now, exclude_blocked=True)
        assert previous_reservation is not None
        assert previous_reservation.name == self.reservation.name


@freeze_time("2023-05-25 12:23:00")
class GetNextReservationTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.space: Space = SpaceFactory()
        self.reservation_unit: ReservationUnit = ReservationUnitFactory(spaces=[self.space])
        self.now = datetime.now(tz=UTC)
        self.reservation_blocked = ReservationFactory(
            begin=(self.now + timedelta(hours=1)),
            end=(self.now + timedelta(hours=2)),
            reservation_unit=[self.reservation_unit],
            type=ReservationTypeChoice.BLOCKED,
            state=ReservationStateChoice.CONFIRMED,
        )
        self.reservation = ReservationFactory(
            begin=(self.now + timedelta(hours=2)),
            end=(self.now + timedelta(hours=3)),
            reservation_unit=[self.reservation_unit],
            state=ReservationStateChoice.CONFIRMED,
        )

    def test_get_next_reservation(self):
        next_reservation = self.reservation_unit.actions.get_next_reservation(self.now)
        assert next_reservation is not None
        assert next_reservation.name == self.reservation_blocked.name

    def test_get_next_reservation_ignored_given_reservation(self):
        next_reservation = self.reservation_unit.actions.get_next_reservation(
            self.now, reservation=self.reservation_blocked
        )
        assert next_reservation is not None
        assert next_reservation.name == self.reservation.name

    def test_get_next_reservation_ignores_blocked(self):
        next_reservation = self.reservation_unit.actions.get_next_reservation(self.now, exclude_blocked=True)
        assert next_reservation is not None
        assert next_reservation.name == self.reservation.name
