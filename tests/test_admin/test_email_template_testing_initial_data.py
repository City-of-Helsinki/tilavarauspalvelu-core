import pytest
from django.test import RequestFactory

from email_notification.admin.email_tester import get_email_template_tester_form_initial_values
from tests.factories import LocationFactory, ReservationUnitFactory, UnitFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]


def test_email_template__get_initial_values_collects_all_data():
    user = UserFactory.create()
    unit = UnitFactory.create(name="Test unit")
    location = LocationFactory.create(
        address_street="Test street 15",
        address_zip="01000",
        address_city="Helsinki",
        unit=unit,
    )
    reservation_unit = ReservationUnitFactory.create(
        name="Test reservation unit",
        reservation_confirmed_instructions_fi="Confirmed FI",
        reservation_confirmed_instructions_en="Confirmed EN",
        reservation_confirmed_instructions_sv="Confirmed SV",
        reservation_pending_instructions_fi="Pending FI",
        reservation_pending_instructions_en="Pending EN",
        reservation_pending_instructions_sv="Pending SV",
        reservation_cancelled_instructions_fi="Cancelled FI",
        reservation_cancelled_instructions_en="Cancelled EN",
        reservation_cancelled_instructions_sv="Cancelled SV",
        unit=unit,
    )

    request = RequestFactory().get("/", {"recipient": "test@example.com", "reservation_unit": reservation_unit.pk})
    request.user = user

    initial_values = get_email_template_tester_form_initial_values(request)

    assert initial_values == {
        "recipient": user.email,
        "reservation_unit_name": reservation_unit.name,
        "unit_name": unit.name,
        "unit_location": f"{location.address_street}, {location.address_zip} {location.address_city}",
        "confirmed_instructions_fi": reservation_unit.reservation_confirmed_instructions_fi,
        "confirmed_instructions_en": reservation_unit.reservation_confirmed_instructions_en,
        "confirmed_instructions_sv": reservation_unit.reservation_confirmed_instructions_sv,
        "pending_instructions_fi": reservation_unit.reservation_pending_instructions_fi,
        "pending_instructions_en": reservation_unit.reservation_pending_instructions_en,
        "pending_instructions_sv": reservation_unit.reservation_pending_instructions_sv,
        "cancelled_instructions_fi": reservation_unit.reservation_cancelled_instructions_fi,
        "cancelled_instructions_en": reservation_unit.reservation_cancelled_instructions_en,
        "cancelled_instructions_sv": reservation_unit.reservation_cancelled_instructions_sv,
    }


def test_email_template__get_initial_values__no_location():
    user = UserFactory.create()
    unit = UnitFactory.create(name="Test unit")
    reservation_unit = ReservationUnitFactory.create(
        name="Test reservation unit",
        reservation_confirmed_instructions_fi="Confirmed FI",
        reservation_confirmed_instructions_en="Confirmed EN",
        reservation_confirmed_instructions_sv="Confirmed SV",
        reservation_pending_instructions_fi="Pending FI",
        reservation_pending_instructions_en="Pending EN",
        reservation_pending_instructions_sv="Pending SV",
        reservation_cancelled_instructions_fi="Cancelled FI",
        reservation_cancelled_instructions_en="Cancelled EN",
        reservation_cancelled_instructions_sv="Cancelled SV",
        unit=unit,
    )

    request = RequestFactory().get("/", {"recipient": "test@example.com", "reservation_unit": reservation_unit.pk})
    request.user = user

    initial_values = get_email_template_tester_form_initial_values(request)

    assert "unit_location" not in initial_values


def test_email_template__get_initial_values__no_unit():
    user = UserFactory.create()
    LocationFactory.create(
        address_street="Test street 15",
        address_zip="01000",
        address_city="Helsinki",
        unit=None,
    )
    reservation_unit = ReservationUnitFactory.create(
        name="Test reservation unit",
        reservation_confirmed_instructions_fi="Confirmed FI",
        reservation_confirmed_instructions_en="Confirmed EN",
        reservation_confirmed_instructions_sv="Confirmed SV",
        reservation_pending_instructions_fi="Pending FI",
        reservation_pending_instructions_en="Pending EN",
        reservation_pending_instructions_sv="Pending SV",
        reservation_cancelled_instructions_fi="Cancelled FI",
        reservation_cancelled_instructions_en="Cancelled EN",
        reservation_cancelled_instructions_sv="Cancelled SV",
        unit=None,
    )

    request = RequestFactory().get("/", {"recipient": "test@example.com", "reservation_unit": reservation_unit.pk})
    request.user = user

    initial_values = get_email_template_tester_form_initial_values(request)

    assert initial_values["unit_name"] == ""


def test_email_template__get_initial_values__no_reservation_unit():
    user = UserFactory.create()
    unit = UnitFactory.create(name="Test unit")
    LocationFactory.create(
        address_street="Test street 15",
        address_zip="01000",
        address_city="Helsinki",
        unit=unit,
    )

    request = RequestFactory().get("/", {"recipient": "test@example.com", "reservation_unit": 0})
    request.user = user

    initial_values = get_email_template_tester_form_initial_values(request)

    assert initial_values == {"recipient": user.email}
