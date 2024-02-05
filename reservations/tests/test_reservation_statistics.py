import datetime
from decimal import Decimal

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import get_default_timezone

from applications.choices import PriorityChoice
from applications.models import City
from reservations.choices import CustomerTypeChoice, ReservationStateChoice
from reservations.models import AgeGroup, ReservationStatistic
from tests.factories import (
    AbilityGroupFactory,
    RecurringReservationFactory,
    ReservationCancelReasonFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    UnitFactory,
)


class ReservationStatisticsCreateTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.joe_the_reggie = get_user_model().objects.create(
            username="regjoe",
            first_name="joe",
            last_name="reggie",
            email="joe.reggie@foo.com",
        )
        cls.reservation_unit = ReservationUnitFactory(name="resu", unit=UnitFactory(name="mesta", tprek_id="1234"))
        cls.recurring = RecurringReservationFactory(application_event_schedule=None)
        cls.priority = PriorityChoice.LOW
        cls.priority_name = PriorityChoice(cls.priority).name
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
            "priority": cls.priority,
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
        assert_that(ReservationStatistic.objects.count()).is_equal_to(1)

        stat = ReservationStatistic.objects.first()
        assert_that(stat.reservation).is_equal_to(self.reservation)
        assert_that(stat.reservation_created_at).is_equal_to(self.reservation.created_at)
        assert_that(stat.reservation_handled_at).is_equal_to(self.reservation.handled_at)
        assert_that(stat.reservation_confirmed_at).is_equal_to(self.reservation.confirmed_at)
        assert_that(stat.reservee_type).is_equal_to(self.reservation.reservee_type)
        assert_that(stat.applying_for_free_of_charge).is_equal_to(self.reservation.applying_for_free_of_charge)
        assert_that(stat.reservee_language).is_equal_to(self.reservation.reservee_language)
        assert_that(stat.num_persons).is_equal_to(self.reservation.num_persons)
        assert_that(stat.priority).is_equal_to(self.reservation.priority)
        assert_that(stat.priority_name).is_equal_to(self.priority_name)
        assert_that(stat.home_city).is_equal_to(self.reservation.home_city)
        assert_that(stat.home_city_name).is_equal_to(self.reservation.home_city.name)
        assert_that(stat.home_city_municipality_code).is_equal_to(self.reservation.home_city.municipality_code)
        assert_that(stat.purpose).is_equal_to(self.reservation.purpose)
        assert_that(stat.purpose_name).is_equal_to(self.reservation.purpose.name)
        assert_that(stat.age_group).is_equal_to(self.reservation.age_group)
        assert_that(stat.age_group_name).is_equal_to(str(self.reservation.age_group))
        assert_that(stat.is_applied).is_false()
        assert_that(stat.ability_group).is_not_none()
        assert_that(stat.begin).is_equal_to(self.reservation.begin)
        assert_that(stat.end).is_equal_to(self.reservation.end)
        assert_that(stat.duration_minutes).is_equal_to(120)
        assert_that(stat.reservation_type).is_equal_to(self.reservation.type)
        assert_that(stat.state).is_equal_to(self.reservation.state)
        assert_that(stat.cancel_reason).is_equal_to(self.reservation.cancel_reason)
        assert_that(stat.cancel_reason_text).is_equal_to("")
        assert_that(stat.deny_reason).is_equal_to(self.reservation.deny_reason)
        assert_that(stat.deny_reason_text).is_equal_to("")
        assert_that(stat.price).is_equal_to(self.reservation.price)
        assert_that(stat.tax_percentage_value).is_equal_to(self.reservation.tax_percentage_value)
        assert_that(stat.reservation_stats_reservation_units.first().reservation_unit).is_equal_to(
            self.reservation_unit
        )
        assert_that(stat.reservation_stats_reservation_units.count()).is_equal_to(1)
        assert_that(stat.primary_reservation_unit_name).is_equal_to(self.reservation_unit.name)
        assert_that(stat.primary_unit_name).is_equal_to(self.reservation_unit.unit.name)
        assert_that(stat.primary_reservation_unit).is_equal_to(self.reservation_unit)
        assert_that(stat.primary_unit_tprek_id).is_equal_to(self.reservation_unit.unit.tprek_id)
        assert_that(stat.ability_group_name).is_empty()
        assert_that(stat.is_subsidised).is_true()
        assert_that(stat.non_subsidised_price).is_equal_to(self.reservation.non_subsidised_price)
        assert_that(stat.non_subsidised_price_net).is_equal_to(self.reservation.non_subsidised_price_net)
        assert_that(stat.is_recurring).is_true()
        assert_that(stat.recurrence_begin_date).is_equal_to(self.recurring.begin_date)
        assert_that(stat.recurrence_end_date).is_equal_to(self.recurring.end_date)
        assert_that(stat.recurrence_uuid).is_equal_to(str(self.recurring.uuid))
        assert_that(stat.reservee_uuid).is_equal_to(str(self.reservation.user.tvp_uuid))
        assert_that(stat.price_net).is_equal_to(self.reservation.price_net)
        assert_that(stat.reservee_is_unregistered_association).is_equal_to(
            self.reservation.reservee_is_unregistered_association
        )
        assert_that(stat.buffer_time_before).is_equal_to(self.reservation.buffer_time_before)
        assert_that(stat.buffer_time_after).is_equal_to(self.reservation.buffer_time_after)

    def test_statistics_update_on_when_updating(self):
        self.reservation.purpose = ReservationPurposeFactory(name="Syy")
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert_that(stat.purpose).is_equal_to(self.reservation.purpose)

    def test_cancel_reason_text(self):
        self.reservation.cancel_reason = ReservationCancelReasonFactory(reason="cancel")
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert_that(stat.cancel_reason_text).is_equal_to("cancel")

    def test_is_applied_has_ability_group_name(self):
        self.reservation.recurring_reservation = RecurringReservationFactory(
            ability_group=AbilityGroupFactory(name="abbis"),
        )
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert_that(stat.is_applied).is_true()
        assert_that(stat.ability_group_name).is_equal_to(self.reservation.recurring_reservation.ability_group.name)

    def test_reservation_units_removed(self):
        self.reservation.reservation_unit.remove(self.reservation_unit)
        resu = ReservationUnitFactory()
        self.reservation.reservation_unit.add(resu)
        self.reservation.save()

        stat = ReservationStatistic.objects.first()
        assert_that(stat.reservation_stats_reservation_units.count()).is_equal_to(1)
        assert_that(stat.reservation_stats_reservation_units.first().reservation_unit).is_equal_to(resu)
        assert_that(stat.primary_reservation_unit_name).is_equal_to(resu.name)
        assert_that(stat.primary_unit_name).is_equal_to(resu.unit.name)
        assert_that(stat.primary_reservation_unit).is_equal_to(resu)
        assert_that(stat.primary_unit_tprek_id).is_equal_to(resu.unit.tprek_id)
