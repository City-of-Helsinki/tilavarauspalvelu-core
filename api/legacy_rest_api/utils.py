import datetime
import hashlib
import hmac
from typing import Any

from django.conf import settings
from django.utils.timezone import get_default_timezone
from icalendar import Calendar, Event
from rest_framework.request import Request

from reservation_units.models import ReservationUnit
from reservations.models import Reservation

ICAL_VERSION = "2.0"


def reservation_unit_calendar(reservation_unit: ReservationUnit):
    cal = Calendar()

    cal.add("version", ICAL_VERSION)
    cal["x-wr-calname"] = reservation_unit.name
    return cal


def export_reservation_events(reservation: Reservation, site_name: str, cal: Calendar):
    ical_event = Event()
    ical_event.add("summary", reservation.actions.get_ical_summary())
    ical_event.add("dtstart", reservation.begin)
    ical_event.add("dtend", reservation.end)
    ical_event.add("dtstamp", datetime.datetime.now(tz=get_default_timezone()))
    ical_event.add("description", reservation.actions.get_ical_description())
    ical_event.add("location", reservation.actions.get_location_string())
    ical_event["uid"] = f"{reservation.pk}.event.events.{site_name}"
    cal.add_component(ical_event)
    return cal


def hmac_signature(value: Any) -> str:
    return hmac.new(
        key=settings.ICAL_HASH_SECRET.encode("utf-8"),
        msg=str(value).encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()


def get_host(request: Request | None):
    return request.get_host() if request else None
