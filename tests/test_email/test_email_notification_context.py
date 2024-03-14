import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from email_notification.sender.email_notification_context import EmailNotificationContext
from reservation_units.models import ReservationUnit
from reservations.choices import CustomerTypeChoice
from reservations.models import Reservation
from spaces.models import Location
from tests.factories import (
    LocationFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationUnitFactory,
)

pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture()
def reservation() -> Reservation:
    reservation_unit = ReservationUnitFactory.create(
        name_fi="ReservationUnit Name FI",
        name_sv="ReservationUnit Name SV",
        name_en="ReservationUnit Name EN",
        unit__name="Test unit",
        unit__name_sv="Svensk test namn",
        unit__name_en="English test name",
    )
    LocationFactory.create(
        unit=reservation_unit.unit,
        address_street="Street",
        address_zip="0100",
        address_city="Rovaniemi",
    )
    deny_reason = ReservationDenyReasonFactory.create(
        reason_fi="Reason FI",
        reason_sv="Reason SV",
        reason_en=None,  # None should use fi as fallback
    )
    cancel_reason = ReservationCancelReasonFactory.create(
        reason_fi="Reason FI",
        reason_sv="Reason SV",
        reason_en="",  # empty string should use fi as fallback
    )
    return ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        name="Test reservation",
        deny_reason=deny_reason,
        cancel_reason=cancel_reason,
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
    )


def test_email_context__with_mock_data():
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


def test_email_context__from_reservation(reservation):
    context = EmailNotificationContext.from_reservation(reservation)
    reservation_unit: ReservationUnit = reservation.reservation_unit.first()

    assert context.reservee_name == f"{reservation.reservee_first_name} {reservation.reservee_last_name}"

    assert context.reservation_name == reservation.name
    assert context.begin_datetime == reservation.begin.astimezone(get_default_timezone())
    assert context.end_datetime == reservation.end.astimezone(get_default_timezone())
    assert context.reservation_number == reservation.id
    assert context.unit_location == str(reservation_unit.unit.location)
    assert context.unit_name == reservation_unit.unit.name
    assert context.price == reservation.price
    assert context.non_subsidised_price == reservation.non_subsidised_price
    assert context.subsidised_price == reservation.price
    assert context.tax_percentage == reservation.tax_percentage_value
    assert context.reservee_language == reservation.reservee_language

    assert context.confirmed_instructions["fi"] == reservation_unit.reservation_confirmed_instructions_fi
    assert context.confirmed_instructions["sv"] == reservation_unit.reservation_confirmed_instructions_sv
    assert context.confirmed_instructions["en"] == reservation_unit.reservation_confirmed_instructions_en
    assert context.pending_instructions["fi"] == reservation_unit.reservation_pending_instructions_fi
    assert context.pending_instructions["sv"] == reservation_unit.reservation_pending_instructions_sv
    assert context.pending_instructions["en"] == reservation_unit.reservation_pending_instructions_en
    assert context.cancelled_instructions["fi"] == reservation_unit.reservation_cancelled_instructions_fi
    assert context.cancelled_instructions["sv"] == reservation_unit.reservation_cancelled_instructions_sv
    assert context.cancelled_instructions["en"] == reservation_unit.reservation_cancelled_instructions_en

    assert context.deny_reason["fi"] == reservation.deny_reason.reason_fi
    assert context.deny_reason["sv"] == reservation.deny_reason.reason_sv
    assert reservation.deny_reason.reason_en is None
    assert context.deny_reason["en"] == reservation.deny_reason.reason_fi

    assert context.cancel_reason["fi"] == reservation.cancel_reason.reason_fi
    assert context.cancel_reason["sv"] == reservation.cancel_reason.reason_sv
    assert reservation.cancel_reason.reason_en == ""
    assert context.cancel_reason["en"] == reservation.cancel_reason.reason_fi


def test_email_context__from_reservation__organisation_name(reservation):
    reservation.reservee_type = CustomerTypeChoice.BUSINESS
    reservation.reservee_organisation_name = "Business"
    reservation.save()

    context = EmailNotificationContext.from_reservation(reservation)
    assert context.reservee_name == reservation.reservee_organisation_name


def test_email_context__from_reservation__no_location(reservation):
    Location.objects.all().delete()
    context = EmailNotificationContext.from_reservation(reservation)
    assert context.unit_location == ""


def test_email_context__from_reservation_unit__name_is_reservee_langauge(reservation):
    reservation.reservee_language = "sv"
    reservation.save()

    context = EmailNotificationContext.from_reservation(reservation)
    assert context.unit_name == reservation.reservation_unit.first().unit.name_sv


def test_email_context__from_reservation_unit__name_uses_reservation_user_preferred_language(reservation):
    user = get_user_model().objects.create(
        username="test",
        first_name="test",
        last_name="user",
        email="test.user@localhost",
        preferred_language="sv",
    )
    reservation.user = user
    reservation.save()

    context = EmailNotificationContext.from_reservation(reservation)
    assert context.unit_name == reservation.reservation_unit.first().unit.name_sv


def test_email_context__from_reservation__reservation_unit_name_is_reservee_langauge(reservation):
    reservation.reservee_language = "sv"
    reservation.save()

    context = EmailNotificationContext.from_reservation(reservation)
    assert context.reservation_unit_name == reservation.reservation_unit.first().name_sv


def test_email_context__from_reservation__reservation_unit_name_uses_reservation_user_preferred_language(reservation):
    user = get_user_model().objects.create(
        username="test",
        first_name="test",
        last_name="user",
        email="test.user@localhost",
        preferred_language="sv",
    )
    reservation.user = user
    reservation.save()

    context = EmailNotificationContext.from_reservation(reservation)
    assert context.reservation_unit_name == reservation.reservation_unit.first().name_sv
