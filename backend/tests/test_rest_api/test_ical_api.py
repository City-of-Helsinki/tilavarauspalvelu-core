from __future__ import annotations

import datetime
import io

import pytest
from django.contrib.gis.geos import Point
from django.test import override_settings
from freezegun import freeze_time
from icalendar import Calendar
from rest_framework.reverse import reverse

from utils.date_utils import local_datetime
from utils.utils import ical_hmac_signature

from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(EMAIL_VARAAMO_EXT_LINK="https://fake.varaamo.hel.fi")
@freeze_time(local_datetime(2023, 1, 1))
def test_reservation_ical(api_client, settings):
    user = UserFactory.create()

    api_client.force_authenticate(user=user)

    unit = UnitFactory.create(
        name="Caisa",
        address_street="Street",
        address_zip="12345",
        address_city="City",
        coordinates=Point(x=1.2, y=3.4),
    )
    reservation_unit = ReservationUnitFactory.create(name="Aitio", unit=unit)
    reservation = ReservationFactory.create(
        reservation_units=[reservation_unit],
        begins_at=datetime.datetime(2024, 1, 1, 12),
        ends_at=datetime.datetime(2024, 1, 1, 14),
        user=user,
    )

    base_url = reverse("reservation_calendar", kwargs={"pk": reservation.pk})
    hash_sig = ical_hmac_signature(f"reservation-{reservation.pk}")
    url = f"{base_url}?hash={hash_sig}"

    response = api_client.get(url)

    assert response.status_code == 200, response.content

    content = io.BytesIO(b"".join(response.streaming_content)).read()
    calendar = Calendar.from_ical(content)

    description = (
        "<!DOCTYPE html>"
        "<html lang='fi'>"
        "<body>"
        "<h3>"
        "Booking details"
        "</h3>"
        "<p>"
        "Aitio, Caisa, Street, 12345 City"
        "</p>"
        "<p>"
        "From: 01.01.2024 at 12:00"
        "</p>"
        "<p>"
        "To: 01.01.2024 at 14:00"
        "</p>"
        "<p>"
        "Manage your booking at Varaamo. You can check the details of your booking and "
        "Varaamo's terms of contract and cancellation on the "
        "<a href='https://fake.varaamo.hel.fi/reservations'>'My bookings'</a> page."
        "</p>"
        "</body>"
        "</html>"
    )

    assert str(calendar["VERSION"]) == "2.0"
    assert str(calendar["PRODID"]) == "-//Helsinki City//NONSGML Varaamo//FI"

    assert len(calendar.subcomponents) == 2

    timezone = calendar.subcomponents[0]
    assert timezone.name == "VTIMEZONE"

    assert str(timezone["TZID"]) == "Europe/Helsinki"
    assert len(timezone.subcomponents) == 2

    standard = timezone.subcomponents[0]
    assert standard.name == "STANDARD"
    assert str(standard["DTSTART"].to_ical().decode()) == "16011028T040000"
    assert str(standard["RRULE"].to_ical().decode()) == "FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10"
    assert str(standard["TZOFFSETFROM"].to_ical()) == "+0300"
    assert str(standard["TZOFFSETTO"].to_ical()) == "+0200"

    daylight = timezone.subcomponents[1]
    assert daylight.name == "DAYLIGHT"
    assert str(daylight["DTSTART"].to_ical().decode()) == "16010325T030000"
    assert str(daylight["RRULE"].to_ical().decode()) == "FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3"
    assert str(daylight["TZOFFSETFROM"].to_ical()) == "+0200"
    assert str(daylight["TZOFFSETTO"].to_ical()) == "+0300"

    event = calendar.subcomponents[1]
    assert event.name == "VEVENT"

    assert str(event["UID"]) == f"varaamo.reservation.{reservation.pk}@https://fake.varaamo.hel.fi"
    assert str(event["DTSTART"].to_ical().decode()) == "20240101T120000"
    assert str(event["DTEND"].to_ical().decode()) == "20240101T140000"
    assert str(event["DTSTAMP"].to_ical().decode()) == "20221231T220000Z"
    assert str(event["SUMMARY"]) == "Reservation for Caisa"
    assert str(event["DESCRIPTION"]) == description
    assert str(event["X-ALT-DESC"]) == description
    assert str(event["LOCATION"]) == "Street, 12345 City"
    assert str(event["GEO"].to_ical()) == "3.4;1.2"


def test_reservation_ical__without_hash(api_client):
    user = UserFactory.create()

    api_client.force_authenticate(user=user)

    reservation = ReservationFactory.create()

    url = reverse("reservation_calendar", kwargs={"pk": reservation.pk})
    response = api_client.get(url)
    assert response.status_code == 400
    assert response.json() == {"detail": "hash is required"}


def test_reservation_ical__with_invalid_hash(api_client):
    user = UserFactory.create()

    api_client.force_authenticate(user=user)

    reservation = ReservationFactory.create()

    base_url = reverse("reservation_calendar", kwargs={"pk": reservation.pk})
    hash_sig = ical_hmac_signature("foo")
    url = f"{base_url}?hash={hash_sig}"

    response = api_client.get(url)

    assert response.status_code == 400
    assert response.json() == {"detail": "invalid hash signature"}
