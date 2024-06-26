import datetime
from decimal import Decimal

import pytest
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
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_statistics__create__reservation_creation_creates_statistics(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_unit = ReservationUnitFactory.create(name="resu", unit=UnitFactory(name="mesta", tprek_id="1234"))
    recurring = RecurringReservationFactory.create(application_event_schedule=None)
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_is_unregistered_association=False,
        home_city=City.objects.create(name="Test", municipality_code="1234"),
        applying_for_free_of_charge=True,
        free_of_charge_reason="This is some reason.",
        age_group=AgeGroup.objects.create(minimum=18, maximum=30),
        name="movies",
        description="movies&popcorn",
        begin=datetime.datetime(2020, 1, 1, 12, 0, tzinfo=get_default_timezone()),
        end=datetime.datetime(2020, 1, 1, 14, 0, tzinfo=get_default_timezone()),
        state=ReservationStateChoice.CREATED.value,
        purpose=ReservationPurposeFactory(name="PurpleChoice"),
        unit_price=10,
        tax_percentage_value=24,
        price=10,
        working_memo="its like that",
        non_subsidised_price=Decimal("11.00"),
        non_subsidised_price_net=Decimal("8.87"),
        recurring_reservation=recurring,
    )

    reservation_unit = reservation.reservation_unit.first()
    recurring = reservation.recurring_reservation

    assert ReservationStatistic.objects.count() == 1

    stat = ReservationStatistic.objects.first()
    assert stat.reservation == reservation
    assert stat.reservation_created_at == reservation.created_at
    assert stat.reservation_handled_at == reservation.handled_at
    assert stat.reservation_confirmed_at == reservation.confirmed_at
    assert stat.reservee_type == reservation.reservee_type
    assert stat.applying_for_free_of_charge == reservation.applying_for_free_of_charge
    assert stat.reservee_language == reservation.reservee_language
    assert stat.num_persons == reservation.num_persons
    assert stat.home_city == reservation.home_city
    assert stat.home_city_name == reservation.home_city.name
    assert stat.home_city_municipality_code == reservation.home_city.municipality_code
    assert stat.purpose == reservation.purpose
    assert stat.purpose_name == reservation.purpose.name
    assert stat.age_group == reservation.age_group
    assert stat.age_group_name == str(reservation.age_group)
    assert stat.is_applied is False
    assert stat.ability_group is not None
    assert stat.begin == reservation.begin
    assert stat.end == reservation.end
    assert stat.duration_minutes == 120
    assert stat.reservation_type == reservation.type
    assert stat.state == reservation.state
    assert stat.cancel_reason == reservation.cancel_reason
    assert stat.cancel_reason_text == ""
    assert stat.deny_reason == reservation.deny_reason
    assert stat.deny_reason_text == ""
    assert stat.price == reservation.price
    assert stat.tax_percentage_value == reservation.tax_percentage_value
    assert stat.reservation_stats_reservation_units.first().reservation_unit == reservation_unit
    assert stat.reservation_stats_reservation_units.count() == 1
    assert stat.primary_reservation_unit_name == reservation_unit.name
    assert stat.primary_unit_name == reservation_unit.unit.name
    assert stat.primary_reservation_unit == reservation_unit
    assert stat.primary_unit_tprek_id == reservation_unit.unit.tprek_id
    assert not stat.ability_group_name
    assert stat.is_subsidised is True
    assert stat.non_subsidised_price == reservation.non_subsidised_price
    assert stat.non_subsidised_price_net == reservation.non_subsidised_price_net
    assert stat.is_recurring is True
    assert stat.recurrence_begin_date == recurring.begin_date
    assert stat.recurrence_end_date == recurring.end_date
    assert stat.recurrence_uuid == str(recurring.uuid)
    assert stat.reservee_uuid == str(reservation.user.tvp_uuid)
    assert stat.price_net == reservation.price_net
    assert stat.reservee_is_unregistered_association == reservation.reservee_is_unregistered_association
    assert stat.buffer_time_before == reservation.buffer_time_before
    assert stat.buffer_time_after == reservation.buffer_time_after


def test_statistics__update__purpose(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create()

    stat = ReservationStatistic.objects.first()
    assert stat.purpose is None

    reservation.purpose = ReservationPurposeFactory.create(name="Syy")
    reservation.save()

    stat = ReservationStatistic.objects.first()
    assert stat.purpose == reservation.purpose


def test_statistics__update__cancel_reason_text(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create()

    stat = ReservationStatistic.objects.first()
    assert stat.cancel_reason_text == ""

    reservation.cancel_reason = ReservationCancelReasonFactory.create(reason="cancel")
    reservation.save()

    stat = ReservationStatistic.objects.first()
    assert stat.cancel_reason_text == "cancel"


def test_statistics__update__reservation_unit_updates_statistics(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_unit = ReservationUnitFactory.create(name="Test reservation unit", unit__name="Test unit")
    reservation = ReservationFactory.create(name="Test reservation", reservation_unit=[reservation_unit])

    statistics = ReservationStatistic.objects.first()
    assert statistics.primary_reservation_unit == reservation_unit

    new_reservation_unit = ReservationUnitFactory.create(name="Another reservation unit", unit__name="Another unit")
    reservation.reservation_unit.set([new_reservation_unit])
    reservation.save()

    statistics = ReservationStatistic.objects.first()
    assert statistics.reservation == reservation
    assert statistics.primary_reservation_unit == new_reservation_unit
    assert statistics.primary_reservation_unit_name == new_reservation_unit.name
    assert statistics.primary_unit_name == new_reservation_unit.unit.name
    assert statistics.primary_unit_tprek_id is None
