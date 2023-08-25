from assertpy import assert_that
from django.test.testcases import TestCase

from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import ReservationStatistic
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import UnitFactory


class ReservationSignalTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.unit = UnitFactory(name="Test unit")
        cls.reservation_unit = ReservationUnitFactory(name="Test reservation unit", unit=cls.unit)

    def test_creating_reservation_creates_statistics(self):
        reservation = ReservationFactory(name="Test reservation", reservation_unit=[self.reservation_unit])
        statistics = ReservationStatistic.objects.first()

        assert_that(reservation).is_not_none()
        assert_that(statistics).is_not_none()

        assert_that(statistics.reservation).is_equal_to(reservation)
        assert_that(statistics.primary_reservation_unit).is_equal_to(self.reservation_unit)
        assert_that(statistics.primary_reservation_unit_name).is_equal_to(self.reservation_unit.name)
        assert_that(statistics.primary_unit_name).is_equal_to(self.unit.name)
        assert_that(statistics.primary_unit_tprek_id).is_none()

    def test_updating_reservation_updates_statistics(self):
        new_unit = UnitFactory(name="Another unit")
        new_reservation_unit = ReservationUnitFactory(name="Another reservation unit", unit=new_unit)

        reservation = ReservationFactory(name="Test reservation", reservation_unit=[self.reservation_unit])
        reservation.reservation_unit.set([new_reservation_unit])
        reservation.save()

        statistics = ReservationStatistic.objects.first()

        assert_that(reservation).is_not_none()
        assert_that(statistics).is_not_none()

        assert_that(statistics.reservation).is_equal_to(reservation)
        assert_that(statistics.primary_reservation_unit).is_equal_to(new_reservation_unit)
        assert_that(statistics.primary_reservation_unit_name).is_equal_to(new_reservation_unit.name)
        assert_that(statistics.primary_unit_name).is_equal_to(new_unit.name)
        assert_that(statistics.primary_unit_tprek_id).is_none()
