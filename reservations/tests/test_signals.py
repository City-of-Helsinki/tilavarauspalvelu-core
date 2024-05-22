from django.test.testcases import TestCase

from reservations.models import ReservationStatistic
from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory


class ReservationSignalTestCase(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.unit = UnitFactory(name="Test unit")
        cls.reservation_unit = ReservationUnitFactory(name="Test reservation unit", unit=cls.unit)

    def test_creating_reservation_creates_statistics(self):
        reservation = ReservationFactory(name="Test reservation", reservation_unit=[self.reservation_unit])
        statistics = ReservationStatistic.objects.first()

        assert reservation is not None
        assert statistics is not None

        assert statistics.reservation == reservation
        assert statistics.primary_reservation_unit == self.reservation_unit
        assert statistics.primary_reservation_unit_name == self.reservation_unit.name
        assert statistics.primary_unit_name == self.unit.name
        assert statistics.primary_unit_tprek_id is None

    def test_updating_reservation_updates_statistics(self):
        new_unit = UnitFactory(name="Another unit")
        new_reservation_unit = ReservationUnitFactory(name="Another reservation unit", unit=new_unit)

        reservation = ReservationFactory(name="Test reservation", reservation_unit=[self.reservation_unit])
        reservation.reservation_unit.set([new_reservation_unit])
        reservation.save()

        statistics = ReservationStatistic.objects.first()

        assert reservation is not None
        assert statistics is not None

        assert statistics.reservation == reservation
        assert statistics.primary_reservation_unit == new_reservation_unit
        assert statistics.primary_reservation_unit_name == new_reservation_unit.name
        assert statistics.primary_unit_name == new_unit.name
        assert statistics.primary_unit_tprek_id is None
