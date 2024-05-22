import datetime
from decimal import Decimal

from django.test import TestCase
from django.utils.timezone import get_default_timezone

from applications.models import City
from reservations.choices import CustomerTypeChoice, ReservationStateChoice
from reservations.models import AgeGroup, ReservationStatistic
from tests.factories import (
    RecurringReservationFactory,
    ReservationCancelReasonFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    UnitFactory,
    UserFactory,
)


class ReservationStatisticsCreateTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.joe_the_reggie = UserFactory.create(
            username="regjoe",
            first_name="joe",
            last_name="reggie",
            email="joe.reggie@foo.com",
        )
        cls.reservation_unit = ReservationUnitFactory(name="resu", unit=UnitFactory(name="mesta", tprek_id="1234"))
        cls.recurring = RecurringReservationFactory(application_event_schedule=None)
        cls.reservation_data = {
            "reservee_type": CustomerTypeChoice.INDIVIDUAL,
            "reservee_is_unregistered_association": False,
            "home_city": City.objects.create(name="Test", municipality_code="1234"),
            "applying_for_free_of_charge": True,
            "free_of_charge_reason": "This is some reason.",
            "age_group": AgeGroup.objects.create(minimum=18, maximum=30),
            "name": "movies",
            "description": "movies&popcorn",
            "begin": datetime.datetime(2020, 1, 1, 12, 0, tzinfo=get_default_timezone()),
            "end": datetime.datetime(2020, 1, 1, 14, 0, tzinfo=get_default_timezone()),
            "state": ReservationStateChoice.CREATED.value,
            "user": cls.joe_the_reggie,
            "purpose": ReservationPurposeFactory(name="PurpleChoice"),
            "unit_price": 10,
            "tax_percentage_value": 24,
            "price": 10,
            "working_memo": "its like that",
            "non_subsidised_price": Decimal("11.00"),
            "non_subsidised_price_net": Decimal("8.87"),
            "recurring_reservation": cls.recurring,
        }
        cls.reservation = ReservationFactory(reservation_unit=[cls.reservation_unit], **cls.reservation_data)

    def test_statistics_create_on_creation(self):
        self.reservation.save()
        assert ReservationStatistic.objects.count() == 1

        stat = ReservationStatistic.objects.first()
        assert stat.reservation == self.reservation
        assert stat.reservation_created_at == self.reservation.created_at
        assert stat.reservation_handled_at == self.reservation.handled_at
        assert stat.reservation_confirmed_at == self.reservation.confirmed_at
        assert stat.reservee_type == self.reservation.reservee_type
        assert stat.applying_for_free_of_charge == self.reservation.applying_for_free_of_charge
        assert stat.reservee_language == self.reservation.reservee_language
        assert stat.num_persons == self.reservation.num_persons
        assert stat.home_city == self.reservation.home_city
        assert stat.home_city_name == self.reservation.home_city.name
        assert stat.home_city_municipality_code == self.reservation.home_city.municipality_code
        assert stat.purpose == self.reservation.purpose
        assert stat.purpose_name == self.reservation.purpose.name
        assert stat.age_group == self.reservation.age_group
        assert stat.age_group_name == str(self.reservation.age_group)
        assert stat.is_applied is False
        assert stat.ability_group is not None
        assert stat.begin == self.reservation.begin
        assert stat.end == self.reservation.end
        assert stat.duration_minutes == 120
        assert stat.reservation_type == self.reservation.type
        assert stat.state == self.reservation.state
        assert stat.cancel_reason == self.reservation.cancel_reason
        assert stat.cancel_reason_text == ""
        assert stat.deny_reason == self.reservation.deny_reason
        assert stat.deny_reason_text == ""
        assert stat.price == self.reservation.price
        assert stat.tax_percentage_value == self.reservation.tax_percentage_value
        assert stat.reservation_stats_reservation_units.first().reservation_unit == self.reservation_unit
        assert stat.reservation_stats_reservation_units.count() == 1
        assert stat.primary_reservation_unit_name == self.reservation_unit.name
        assert stat.primary_unit_name == self.reservation_unit.unit.name
        assert stat.primary_reservation_unit == self.reservation_unit
        assert stat.primary_unit_tprek_id == self.reservation_unit.unit.tprek_id
        assert not stat.ability_group_name
        assert stat.is_subsidised is True
        assert stat.non_subsidised_price == self.reservation.non_subsidised_price
        assert stat.non_subsidised_price_net == self.reservation.non_subsidised_price_net
        assert stat.is_recurring is True
        assert stat.recurrence_begin_date == self.recurring.begin_date
        assert stat.recurrence_end_date == self.recurring.end_date
        assert stat.recurrence_uuid == str(self.recurring.uuid)
        assert stat.reservee_uuid == str(self.reservation.user.tvp_uuid)
        assert stat.price_net == self.reservation.price_net
        assert stat.reservee_is_unregistered_association == self.reservation.reservee_is_unregistered_association
        assert stat.buffer_time_before == self.reservation.buffer_time_before
        assert stat.buffer_time_after == self.reservation.buffer_time_after

    def test_statistics_update_on_when_updating(self):
        self.reservation.purpose = ReservationPurposeFactory(name="Syy")
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert stat.purpose == self.reservation.purpose

    def test_cancel_reason_text(self):
        self.reservation.cancel_reason = ReservationCancelReasonFactory(reason="cancel")
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert stat.cancel_reason_text == "cancel"

    def test_reservation_units_removed(self):
        self.reservation.reservation_unit.remove(self.reservation_unit)
        resu = ReservationUnitFactory()
        self.reservation.reservation_unit.add(resu)
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert stat.reservation_stats_reservation_units.count() == 1
        assert stat.reservation_stats_reservation_units.first().reservation_unit == resu
        assert stat.primary_reservation_unit_name == resu.name
        assert stat.primary_unit_name == resu.unit.name
        assert stat.primary_reservation_unit == resu
        assert stat.primary_unit_tprek_id == resu.unit.tprek_id
