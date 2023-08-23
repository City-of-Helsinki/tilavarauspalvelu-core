from assertpy import assert_that
from django.contrib.auth.models import User
from django.test.client import RequestFactory
from django.test.testcases import TestCase

from email_notification.admin import get_initial_values
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.tests.factories import LocationFactory, UnitFactory


class GetInitialValuesTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User()
        self.user.email = "test@example.com"

        self.unit = UnitFactory.create(name="Test unit")
        self.location = LocationFactory.create(
            address_street="Test street 15",
            address_zip="01000",
            address_city="Helsinki",
            unit=self.unit,
        )
        self.reservation_unit = ReservationUnitFactory.create(
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
            unit=self.unit,
        )

    def test_get_initial_values_collects_all_data(self):
        request = RequestFactory().get(
            "/",
            {
                "recipient": "test@example.com",
                "reservation_unit": self.reservation_unit.pk,
            },
        )

        request.user = self.user
        assert_that(get_initial_values(request)).is_equal_to(
            {
                "recipient": "test@example.com",
                "reservation_unit_name": "Test reservation unit",
                "unit_name": "Test unit",
                "unit_location": "Test street 15 01000 Helsinki",
                "confirmed_instructions_fi": "Confirmed FI",
                "confirmed_instructions_en": "Confirmed EN",
                "confirmed_instructions_sv": "Confirmed SV",
                "pending_instructions_fi": "Pending FI",
                "pending_instructions_en": "Pending EN",
                "pending_instructions_sv": "Pending SV",
                "cancelled_instructions_fi": "Cancelled FI",
                "cancelled_instructions_en": "Cancelled EN",
                "cancelled_instructions_sv": "Cancelled SV",
            }
        )

    def test_get_initial_values_with_location_missing(self):
        self.location.delete()

        request = RequestFactory().get(
            "/",
            {
                "recipient": "test@example.com",
                "reservation_unit": self.reservation_unit.pk,
            },
        )

        request.user = self.user
        assert_that(get_initial_values(request)).is_equal_to(
            {
                "recipient": "test@example.com",
                "reservation_unit_name": "Test reservation unit",
                "unit_name": "Test unit",
                "confirmed_instructions_fi": "Confirmed FI",
                "confirmed_instructions_en": "Confirmed EN",
                "confirmed_instructions_sv": "Confirmed SV",
                "pending_instructions_fi": "Pending FI",
                "pending_instructions_en": "Pending EN",
                "pending_instructions_sv": "Pending SV",
                "cancelled_instructions_fi": "Cancelled FI",
                "cancelled_instructions_en": "Cancelled EN",
                "cancelled_instructions_sv": "Cancelled SV",
            }
        )

    def test_get_initial_values_with_unit_missing(self):
        self.reservation_unit.unit = None
        self.reservation_unit.save()

        request = RequestFactory().get(
            "/",
            {
                "recipient": "test@example.com",
                "reservation_unit": self.reservation_unit.pk,
            },
        )

        request.user = self.user
        assert_that(get_initial_values(request)).is_equal_to(
            {
                "recipient": "test@example.com",
                "reservation_unit_name": "Test reservation unit",
                "unit_name": "",
                "confirmed_instructions_fi": "Confirmed FI",
                "confirmed_instructions_en": "Confirmed EN",
                "confirmed_instructions_sv": "Confirmed SV",
                "pending_instructions_fi": "Pending FI",
                "pending_instructions_en": "Pending EN",
                "pending_instructions_sv": "Pending SV",
                "cancelled_instructions_fi": "Cancelled FI",
                "cancelled_instructions_en": "Cancelled EN",
                "cancelled_instructions_sv": "Cancelled SV",
            }
        )

    def test_get_initial_values_with_reservation_unit_missing(self):
        request = RequestFactory().get("/", {"recipient": "test@example.com", "reservation_unit": 99999})

        request.user = self.user
        assert_that(get_initial_values(request)).is_equal_to({"recipient": "test@example.com"})
