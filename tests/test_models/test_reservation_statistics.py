import datetime
from decimal import Decimal

import pytest
from django.utils.timezone import get_default_timezone

from applications.models import City
from tests.factories import (
    RecurringReservationFactory,
    ReservationCancelReasonFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    UnitFactory,
)
from tilavarauspalvelu.enums import CustomerTypeChoice, ReservationStateChoice
from tilavarauspalvelu.models import AgeGroup, ReservationStatistic

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_statistics__create__reservation_creation_creates_statistics(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_unit = ReservationUnitFactory.create(name="resu", unit=UnitFactory(name="mesta", tprek_id="1234"))
    recurring = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        age_group=AgeGroup.objects.create(minimum=18, maximum=30),
        applying_for_free_of_charge=True,
        begin=datetime.datetime(2020, 1, 1, 12, 0, tzinfo=get_default_timezone()),
        description="movies&popcorn",
        end=datetime.datetime(2020, 1, 1, 14, 0, tzinfo=get_default_timezone()),
        free_of_charge_reason="This is some reason.",
        home_city=City.objects.create(name="Test", municipality_code="1234"),
        name="movies",
        non_subsidised_price=Decimal("11.00"),
        price=10,
        purpose=ReservationPurposeFactory(name="PurpleChoice"),
        recurring_reservation=recurring,
        reservation_unit=[reservation_unit],
        reservee_address_zip="12345",
        reservee_id="123456789",
        reservee_is_unregistered_association=False,
        reservee_organisation_name="Test organisation",
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        state=ReservationStateChoice.CREATED.value,
        tax_percentage_value=24,
        unit_price=10,
        working_memo="its like that",
    )

    reservation_unit = reservation.reservation_unit.first()
    recurring = reservation.recurring_reservation

    assert ReservationStatistic.objects.count() == 1

    stat: ReservationStatistic | None = ReservationStatistic.objects.first()
    assert stat.ability_group is not None
    assert stat.ability_group_name == reservation.recurring_reservation.ability_group.name
    assert stat.age_group == reservation.age_group
    assert stat.age_group_name == str(reservation.age_group)
    assert stat.applying_for_free_of_charge == reservation.applying_for_free_of_charge
    assert stat.begin == reservation.begin
    assert stat.buffer_time_after == reservation.buffer_time_after
    assert stat.buffer_time_before == reservation.buffer_time_before
    assert stat.cancel_reason == reservation.cancel_reason
    assert stat.cancel_reason_text == ""
    assert stat.deny_reason == reservation.deny_reason
    assert stat.deny_reason_text == ""
    assert stat.duration_minutes == 120
    assert stat.end == reservation.end
    assert stat.home_city == reservation.home_city
    assert stat.home_city_municipality_code == reservation.home_city.municipality_code
    assert stat.home_city_name == reservation.home_city.name
    assert stat.is_applied is True
    assert stat.is_recurring is True
    assert stat.is_subsidised is True
    assert stat.non_subsidised_price == reservation.non_subsidised_price
    assert stat.non_subsidised_price_net == reservation.non_subsidised_price_net
    assert stat.num_persons == reservation.num_persons
    assert stat.price == reservation.price
    assert stat.price_net == reservation.price_net
    assert stat.primary_reservation_unit == reservation_unit
    assert stat.primary_reservation_unit_name == reservation_unit.name
    assert stat.primary_unit_name == reservation_unit.unit.name
    assert stat.primary_unit_tprek_id == reservation_unit.unit.tprek_id
    assert stat.purpose == reservation.purpose
    assert stat.purpose_name == reservation.purpose.name
    assert stat.recurrence_begin_date == recurring.begin_date
    assert stat.recurrence_end_date == recurring.end_date
    assert stat.recurrence_uuid == str(recurring.uuid)
    assert stat.reservation == reservation
    assert stat.reservation_confirmed_at == reservation.confirmed_at
    assert stat.reservation_created_at == reservation.created_at
    assert stat.reservation_handled_at == reservation.handled_at
    assert stat.reservation_stats_reservation_units.count() == 1
    assert stat.reservation_stats_reservation_units.first().reservation_unit == reservation_unit
    assert stat.reservation_type == reservation.type
    assert stat.reservee_address_zip == ""
    assert stat.reservee_id == ""
    assert stat.reservee_is_unregistered_association == reservation.reservee_is_unregistered_association
    assert stat.reservee_language == reservation.reservee_language
    assert stat.reservee_organisation_name == ""
    assert stat.reservee_type == reservation.reservee_type
    assert stat.reservee_uuid == str(reservation.user.tvp_uuid)
    assert stat.state == reservation.state
    assert stat.tax_percentage_value == reservation.tax_percentage_value


def test_statistics__update__reservee_address_zip__has_profile_id(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create(
        user__profile_id="123456789",
        reservee_address_zip="12345",
    )

    stat = ReservationStatistic.objects.first()
    assert stat.reservee_address_zip == reservation.reservee_address_zip


def test_statistics__update__reservee_address_zip__no_profile_id(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create(
        user__profile_id="",
        reservee_address_zip="12345",
    )

    stat = ReservationStatistic.objects.first()
    assert stat.reservee_address_zip == ""


def test_statistics__update__org_info_for_unregistered_organisation(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create(
        reservee_is_unregistered_association=True,
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="Test organisation",
        reservee_id="123456789",
    )

    stat = ReservationStatistic.objects.first()
    assert stat.reservee_organisation_name == reservation.reservee_organisation_name
    assert stat.reservee_id == ""


def test_statistics__update__org_info_for_registered_organisation(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation = ReservationFactory.create(
        reservee_is_unregistered_association=False,
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="Test organisation",
        reservee_id="123456789",
    )

    stat = ReservationStatistic.objects.first()
    assert stat.reservee_organisation_name == reservation.reservee_organisation_name
    assert stat.reservee_id == reservation.reservee_id


def test_statistics__update__no_org_info_for_individual(settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    ReservationFactory.create(
        reservee_is_unregistered_association=True,
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_organisation_name="Test organisation",
        reservee_id="123456789",
    )

    stat = ReservationStatistic.objects.first()
    assert stat.reservee_organisation_name == ""
    assert stat.reservee_id == ""


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
