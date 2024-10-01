from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy
from icalendar import Calendar, Event

from tilavarauspalvelu.enums import CalendarProperty, EventProperty
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.utils import get_attr_by_language

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Location, Reservation, ReservationUnit, Unit
    from tilavarauspalvelu.typing import Lang


__all__ = [
    "ReservationActions",
]


class ReservationActions:
    def __init__(self, reservation: Reservation) -> None:
        self.reservation = reservation

    def get_actual_before_buffer(self) -> datetime.timedelta:
        buffer_time_before: datetime.timedelta = self.reservation.buffer_time_before or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_unit.all():
            before = reservation_unit.actions.get_actual_before_buffer(self.reservation.begin)
            buffer_time_before = max(before, buffer_time_before)
        return buffer_time_before

    def get_actual_after_buffer(self) -> datetime.timedelta:
        buffer_time_after: datetime.timedelta = self.reservation.buffer_time_after or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_unit.all():
            after = reservation_unit.actions.get_actual_after_buffer(self.reservation.end)
            buffer_time_after = max(after, buffer_time_after)
        return buffer_time_after

    def to_ical(self, *, site_name: str) -> bytes:
        language: Lang = (  # type: ignore[assignment]
            self.reservation.reservee_language
            or (self.reservation.user is not None and self.reservation.user.get_preferred_language())
            or settings.LANGUAGE_CODE
        )

        ical_event = Event()
        # This should be unique such that if another iCal file is created
        # for the same reservation, it will be the same as the previous one.
        uid = f"varaamo.reservation.{self.reservation.pk}@{site_name}"
        summary = self.get_ical_summary(language=language)
        description = self.get_ical_description(site_name=site_name, language=language)
        location = self.get_location()

        ical_event.add(name=EventProperty.UID, value=uid)
        ical_event.add(name=EventProperty.DTSTAMP, value=local_datetime())
        ical_event.add(name=EventProperty.DTSTART, value=self.reservation.begin.astimezone(DEFAULT_TIMEZONE))
        ical_event.add(name=EventProperty.DTEND, value=self.reservation.end.astimezone(DEFAULT_TIMEZONE))

        ical_event.add(name=EventProperty.SUMMARY, value=summary)
        ical_event.add(name=EventProperty.DESCRIPTION, value=description, parameters={"FMTTYPE": "text/html"})
        ical_event.add(name=EventProperty.X_ALT_DESC, value=description, parameters={"FMTTYPE": "text/html"})

        if location is not None:
            ical_event.add(name=EventProperty.LOCATION, value=location.address)
            if location.coordinates is not None:
                ical_event.add(name=EventProperty.GEO, value=(location.lat, location.lon))

        cal = Calendar()
        cal.add(CalendarProperty.VERSION, "2.0")
        cal.add(CalendarProperty.PRODID, "-//Helsinki City//NONSGML Varaamo//FI")

        cal.add_component(ical_event)
        return cal.to_ical()

    def get_ical_summary(self, *, language: Lang = "fi") -> str:
        unit: Unit = self.reservation.reservation_unit.first().unit
        unit_name = get_attr_by_language(unit, "name", language)
        return _("Reservation for %(name)s") % {"name": unit_name}

    def get_ical_description(self, *, site_name: str, language: Lang = "fi") -> str:
        reservation_unit: ReservationUnit = self.reservation.reservation_unit.first()
        unit: Unit = reservation_unit.unit
        begin = self.reservation.begin.astimezone(DEFAULT_TIMEZONE)
        end = self.reservation.end.astimezone(DEFAULT_TIMEZONE)

        title = _("Booking details")
        reservation_unit_name = get_attr_by_language(reservation_unit, "name", language)
        unit_name = get_attr_by_language(unit, "name", language)
        location = self.get_location()
        address = location.address if location is not None else ""
        start_date = begin.date().strftime("%d.%m.%Y")
        start_time = begin.time().strftime("%H:%M")
        end_date = end.date().strftime("%d.%m.%Y")
        end_time = end.time().strftime("%H:%M")
        time_delimiter = "klo" if language == "fi" else "kl." if language == "sv" else "at"
        if language == "sv":
            site_name += "/sv"
        elif language == "en":
            site_name += "/en"
        from_ = pgettext_lazy("ical", "From")
        to_ = pgettext_lazy("ical", "To")
        footer = _(
            "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
            "terms of contract and cancellation on the '%(bookings)s' page."
        ) % {
            "bookings": f"<a href='https://{site_name}/reservations'>" + _("My bookings") + "</a>",
        }

        return (
            f"<!DOCTYPE html>"
            f"<html lang='{language}'>"
            f"<body>"
            f"<h3>{title}</h3>"
            f"<p>{reservation_unit_name}, {unit_name}, {address}</p>"
            f"<p>{from_}: {start_date} {time_delimiter} {start_time}</p>"
            f"<p>{to_}: {end_date} {time_delimiter} {end_time}</p>"
            f"<p>{footer}</p>"
            f"</body>"
            f"</html>"
        )

    def get_location(self) -> Location | None:
        reservation_unit: ReservationUnit = self.reservation.reservation_unit.first()
        unit: Unit = reservation_unit.unit
        location: Location | None = getattr(unit, "location", None)
        if location is None:
            return reservation_unit.actions.get_location()
        return location
