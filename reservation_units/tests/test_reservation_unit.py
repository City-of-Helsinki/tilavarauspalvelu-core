from datetime import datetime, timedelta, timezone

from assertpy import assert_that
from django.test import TestCase
from freezegun import freeze_time

from reservation_units.models import ReservationUnit
from reservations.models import STATE_CHOICES, ReservationType
from spaces.models import Space
from tests.factories import ReservationFactory, ReservationUnitFactory, SpaceFactory


@freeze_time("2023-05-25 12:23:00")
class GetPreviousReservationTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.space: Space = SpaceFactory()
        self.reservation_unit: ReservationUnit = ReservationUnitFactory(spaces=[self.space])
        self.now = datetime.now(tz=timezone.utc)
        self.reservation_blocked = ReservationFactory(
            begin=(self.now - timedelta(hours=2)),
            end=(self.now - timedelta(hours=1)),
            reservation_unit=[self.reservation_unit],
            type=ReservationType.BLOCKED,
            state=STATE_CHOICES.CONFIRMED,
        )
        self.reservation = ReservationFactory(
            begin=(self.now - timedelta(hours=3)),
            end=(self.now - timedelta(hours=2)),
            reservation_unit=[self.reservation_unit],
            state=STATE_CHOICES.CONFIRMED,
        )

    def test_get_previous_reservation(self):
        previous_reservation = self.reservation_unit.get_previous_reservation(self.now)
        assert_that(previous_reservation).is_not_none()
        assert_that(previous_reservation.name).is_equal_to(self.reservation_blocked.name)

    def test_get_previous_reservation_ignored_given_reservation(self):
        previous_reservation = self.reservation_unit.get_previous_reservation(
            self.now, reservation=self.reservation_blocked
        )
        assert_that(previous_reservation).is_not_none()
        assert_that(previous_reservation.name).is_equal_to(self.reservation.name)

    def test_get_previous_reservation_ignores_blocked(self):
        previous_reservation = self.reservation_unit.get_previous_reservation(self.now, exclude_blocked=True)
        assert_that(previous_reservation).is_not_none()
        assert_that(previous_reservation.name).is_equal_to(self.reservation.name)


@freeze_time("2023-05-25 12:23:00")
class GetNextReservationTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.space: Space = SpaceFactory()
        self.reservation_unit: ReservationUnit = ReservationUnitFactory(spaces=[self.space])
        self.now = datetime.now(tz=timezone.utc)
        self.reservation_blocked = ReservationFactory(
            begin=(self.now + timedelta(hours=1)),
            end=(self.now + timedelta(hours=2)),
            reservation_unit=[self.reservation_unit],
            type=ReservationType.BLOCKED,
            state=STATE_CHOICES.CONFIRMED,
        )
        self.reservation = ReservationFactory(
            begin=(self.now + timedelta(hours=2)),
            end=(self.now + timedelta(hours=3)),
            reservation_unit=[self.reservation_unit],
            state=STATE_CHOICES.CONFIRMED,
        )

    def test_get_next_reservation(self):
        next_reservation = self.reservation_unit.get_next_reservation(self.now)
        assert_that(next_reservation).is_not_none()
        assert_that(next_reservation.name).is_equal_to(self.reservation_blocked.name)

    def test_get_next_reservation_ignored_given_reservation(self):
        next_reservation = self.reservation_unit.get_next_reservation(self.now, reservation=self.reservation_blocked)
        assert_that(next_reservation).is_not_none()
        assert_that(next_reservation.name).is_equal_to(self.reservation.name)

    def test_get_next_reservation_ignores_blocked(self):
        next_reservation = self.reservation_unit.get_next_reservation(self.now, exclude_blocked=True)
        assert_that(next_reservation).is_not_none()
        assert_that(next_reservation.name).is_equal_to(self.reservation.name)
