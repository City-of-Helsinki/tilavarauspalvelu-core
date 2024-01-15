import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import get_default_timezone

from email_notification.sender.email_notification_context import (
    EmailNotificationContext,
)
from reservations.choices import CustomerTypeChoice
from tests.factories import (
    LocationFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationUnitFactory,
    UnitFactory,
)


class EmailNotificationContextTestCase(TestCase):
    def setUp(self) -> None:
        self.unit = UnitFactory.create(name="Test unit", name_sv="Svensk test namn", name_en="English test name")
        self.location = LocationFactory.create(
            unit=self.unit,
            address_street="Street",
            address_zip="0100",
            address_city="Rovaniemi",
        )
        self.reservation_unit = ReservationUnitFactory.create(unit=self.unit)
        self.deny_reason = ReservationDenyReasonFactory.create()
        self.cancel_reason = ReservationCancelReasonFactory.create()
        self.reservation = ReservationFactory.create(
            reservation_unit=[self.reservation_unit],
            deny_reason=self.deny_reason,
            cancel_reason=self.cancel_reason,
        )

    def test_with_mock_data(self):
        context = EmailNotificationContext.with_mock_data()
        assert context.reservee_name == "Email Test"
        assert context.begin_datetime == (datetime.datetime(2100, 1, 1, 12, 00))
        assert context.end_datetime == (datetime.datetime(2100, 1, 1, 13, 15))
        assert context.reservation_number == 1234567
        assert context.unit_location == "Testikatu 99999 Korvatunturi"
        assert context.unit_name == "TOIMIPISTE"
        assert context.reservation_name == "TESTIVARAUS"
        assert context.reservation_unit_name == "VARAUSYKSIKKÖ"
        assert context.price == (Decimal("12.30"))
        assert context.non_subsidised_price == (Decimal("15.00"))
        assert context.subsidised_price == (Decimal("5.00"))
        assert context.tax_percentage == 24
        assert context.confirmed_instructions == {
            "fi": "[lisäohje: hyväksytty]",
            "sv": "[mer information: bekräftats]",
            "en": "[additional info: confirmed]",
        }

        assert context.pending_instructions == {
            "fi": "[lisäohje: käsittelyssä]",
            "sv": "[mer information: kräver hantering]",
            "en": "[additional info: requires handling]",
        }

        assert context.cancelled_instructions == {
            "fi": "[lisäohje: peruttu]",
            "sv": "[mer information: avbokad]",
            "en": "[additional info: cancelled]",
        }

        assert context.deny_reason == {
            "fi": "[syy]",
            "sv": "[orsak]",
            "en": "[reason]",
        }

        assert context.cancel_reason == {
            "fi": "[syy]",
            "sv": "[orsak]",
            "en": "[reason]",
        }

        assert (len(context.__dict__.keys())) == 17

    def test_from_reservation(self):
        context = EmailNotificationContext.from_reservation(self.reservation)

        assert context.reservee_name == f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}"

        assert context.reservation_name == self.reservation.name
        assert context.begin_datetime == self.reservation.begin.astimezone(get_default_timezone())
        assert context.end_datetime == self.reservation.end.astimezone(get_default_timezone())
        assert context.reservation_number == self.reservation.id
        assert context.unit_location == (
            f"{self.location.address_street} {self.location.address_zip} {self.location.address_city}"
        )
        assert context.unit_name == self.unit.name
        assert context.price == self.reservation.price
        assert context.non_subsidised_price == self.reservation.non_subsidised_price
        assert context.subsidised_price == self.reservation.price
        assert context.tax_percentage == self.reservation.tax_percentage_value
        assert context.reservee_language == self.reservation.reservee_language
        assert context.confirmed_instructions["fi"] == self.reservation_unit.reservation_confirmed_instructions_fi
        assert context.confirmed_instructions["sv"] == self.reservation_unit.reservation_confirmed_instructions_sv
        assert context.confirmed_instructions["en"] == self.reservation_unit.reservation_confirmed_instructions_en
        assert context.pending_instructions["fi"] == self.reservation_unit.reservation_pending_instructions_fi
        assert context.pending_instructions["sv"] == self.reservation_unit.reservation_pending_instructions_sv
        assert context.pending_instructions["en"] == self.reservation_unit.reservation_pending_instructions_en
        assert context.cancelled_instructions["fi"] == self.reservation_unit.reservation_cancelled_instructions_fi
        assert context.cancelled_instructions["sv"] == self.reservation_unit.reservation_cancelled_instructions_sv
        assert context.cancelled_instructions["en"] == self.reservation_unit.reservation_cancelled_instructions_en
        assert context.deny_reason["fi"] == self.deny_reason.reason_fi
        assert context.deny_reason["sv"] == self.deny_reason.reason_sv
        assert context.deny_reason["en"] == self.deny_reason.reason_en
        assert context.cancel_reason["fi"] == self.cancel_reason.reason_fi
        assert context.cancel_reason["sv"] == self.cancel_reason.reason_sv
        assert context.cancel_reason["en"] == self.cancel_reason.reason_en

    def test_from_reservation_organisation_name(self):
        self.reservation.reservee_type = CustomerTypeChoice.BUSINESS
        self.reservation.reservee_organisation_name = "Business"
        self.reservation.save()

        context = EmailNotificationContext.from_reservation(self.reservation)
        assert context.reservee_name == self.reservation.reservee_organisation_name

    def test_from_reservation_no_location(self):
        self.location.delete()
        context = EmailNotificationContext.from_reservation(self.reservation)
        assert context.unit_location is None

    def test_from_reservation_unit_name_is_reservee_langauge(self):
        self.reservation.reservee_language = "sv"
        self.reservation.save()

        context = EmailNotificationContext.from_reservation(self.reservation)
        assert context.unit_name == self.unit.name_sv

    def test_from_reservation_unit_name_uses_reservation_user_preferred_language(self):
        user = get_user_model().objects.create(
            username="test",
            first_name="test",
            last_name="user",
            email="test.user@localhost",
            preferred_language="sv",
        )
        self.reservation.user = user
        self.reservation.save()

        context = EmailNotificationContext.from_reservation(self.reservation)
        assert context.unit_name == self.unit.name_sv

    def test_from_reservation_reservation_unit_name_is_reservee_langauge(self):
        self.reservation.reservee_language = "sv"
        self.reservation.save()

        context = EmailNotificationContext.from_reservation(self.reservation)
        assert context.reservation_unit_name == self.reservation_unit.name_sv

    def test_from_reservation_reservation_unit_name_uses_reservation_user_preferred_language(
        self,
    ):
        user = get_user_model().objects.create(
            username="test",
            first_name="test",
            last_name="user",
            email="test.user@localhost",
            preferred_language="sv",
        )
        self.reservation.user = user
        self.reservation.save()

        context = EmailNotificationContext.from_reservation(self.reservation)
        assert context.reservation_unit_name == self.reservation_unit.name_sv
