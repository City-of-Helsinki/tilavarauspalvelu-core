from __future__ import annotations

import datetime
import math
from decimal import Decimal
from typing import TYPE_CHECKING, Literal

from django.conf import settings
from django.db.models import Prefetch
from django.utils.translation import pgettext
from icalendar import Calendar, Event, Timezone, TimezoneDaylight, TimezoneStandard

from tilavarauspalvelu.enums import (
    CalendarProperty,
    CustomerTypeChoice,
    EventProperty,
    PriceUnit,
    PricingType,
    TimezoneProperty,
    TimezoneRuleProperty,
)
from tilavarauspalvelu.models import Space
from tilavarauspalvelu.translation import get_attr_by_language, get_translated
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

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
        for reservation_unit in self.reservation.reservation_units.all():
            before = reservation_unit.actions.get_actual_before_buffer(self.reservation.begin)
            buffer_time_before = max(before, buffer_time_before)
        return buffer_time_before

    def get_actual_after_buffer(self) -> datetime.timedelta:
        buffer_time_after: datetime.timedelta = self.reservation.buffer_time_after or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_units.all():
            after = reservation_unit.actions.get_actual_after_buffer(self.reservation.end)
            buffer_time_after = max(after, buffer_time_after)
        return buffer_time_after

    def to_ical(self) -> bytes:
        language: Lang = (  # type: ignore[assignment]
            self.reservation.reservee_language
            or (self.reservation.user is not None and self.reservation.user.get_preferred_language())
            or settings.LANGUAGE_CODE
        )

        cal = Calendar()
        cal.add(CalendarProperty.VERSION, "2.0")
        cal.add(CalendarProperty.PRODID, "-//Helsinki City//NONSGML Varaamo//FI")

        cal.add_component(self._get_ical_timezone())
        cal.add_component(self._get_ical_event(language=language))

        return cal.to_ical()

    def _get_ical_timezone(self) -> Timezone:
        """Adds timezone information to the ical calendar event."""
        # Note: This assumes that the ical Event is created in 'Europe/Helsinki' timezone.
        timezone = Timezone()
        timezone.add(TimezoneProperty.TZID, settings.TIME_ZONE)

        # Taken from outlook generated 'ical' files.
        # These assumptions are valid for timezone which observe European Summer Time
        # as currently defined (EU directive 2000/84/EC).
        standard_start = datetime.datetime(1601, 10, 28, 4, 0, 0)
        daylight_start = datetime.datetime(1601, 3, 25, 3, 0, 0)

        standard = TimezoneStandard()
        standard.add(name=TimezoneRuleProperty.DTSTART, value=standard_start)
        standard.add(
            name=TimezoneRuleProperty.RRULE,
            value={"FREQ": "YEARLY", "BYDAY": "-1SU", "BYMONTH": 10},
        )
        standard.add(name=TimezoneRuleProperty.TZOFFSETFROM, value=datetime.timedelta(hours=3))
        standard.add(name=TimezoneRuleProperty.TZOFFSETTO, value=datetime.timedelta(hours=2))

        daylight = TimezoneDaylight()
        daylight.add(name=TimezoneRuleProperty.DTSTART, value=daylight_start)
        daylight.add(
            name=TimezoneRuleProperty.RRULE,
            value={"FREQ": "YEARLY", "BYDAY": "-1SU", "BYMONTH": 3},
        )
        daylight.add(name=TimezoneRuleProperty.TZOFFSETFROM, value=datetime.timedelta(hours=2))
        daylight.add(name=TimezoneRuleProperty.TZOFFSETTO, value=datetime.timedelta(hours=3))

        timezone.add_component(standard)
        timezone.add_component(daylight)
        return timezone

    def _get_ical_event(self, *, language: Lang) -> Event:
        """Adds the actual event information to the ical file."""
        ical_event = Event()

        site_name = str(settings.EMAIL_VARAAMO_EXT_LINK).removesuffix("/")
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

        return ical_event

    @get_translated
    def get_ical_summary(self, *, language: Lang = "fi") -> str:
        unit: Unit = self.reservation.reservation_units.first().unit
        unit_name = get_attr_by_language(unit, "name", language)
        return pgettext("ICAL", "Reservation for %(name)s") % {"name": unit_name}

    @get_translated
    def get_ical_description(self, *, site_name: str, language: Lang = "fi") -> str:
        reservation_unit: ReservationUnit = self.reservation.reservation_units.first()
        unit: Unit = reservation_unit.unit
        begin = self.reservation.begin.astimezone(DEFAULT_TIMEZONE)
        end = self.reservation.end.astimezone(DEFAULT_TIMEZONE)

        title = pgettext("ICAL", "Booking details")
        reservation_unit_name = get_attr_by_language(reservation_unit, "name", language)
        unit_name = get_attr_by_language(unit, "name", language)
        location = self.get_location()
        address = location.address if location is not None else ""
        start_date = begin.date().strftime("%d.%m.%Y")
        start_time = begin.time().strftime("%H:%M")
        end_date = end.date().strftime("%d.%m.%Y")
        end_time = end.time().strftime("%H:%M")
        time_delimiter = pgettext("ICAL", "at")
        if language == "sv":
            site_name += "/sv"
        elif language == "en":
            site_name += "/en"
        from_ = pgettext("ICAL", "From")
        to_ = pgettext("ICAL", "To")
        footer = pgettext(
            "ICAL",
            # NOTE: Must format like this (not in braces '()' for example) so that translations pick it up.
            "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
            "terms of contract and cancellation on the '%(bookings)s' page.",
        ) % {
            "bookings": f"<a href='{site_name}/reservations'>" + pgettext("ICAL", "My bookings") + "</a>",
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
        reservation_unit: ReservationUnit = (
            self.reservation.reservation_units.select_related("unit__location")
            .prefetch_related(Prefetch("spaces", Space.objects.select_related("location")))
            .first()
        )
        unit: Unit = reservation_unit.unit
        location: Location | None = getattr(unit, "location", None)
        if location is None:
            return reservation_unit.actions.get_location()
        return location

    def get_email_reservee_name(self) -> str:
        # Note: Different from 'reservation.reservee_name' (simpler, mainly)
        if self.reservation.reservee_type in (CustomerTypeChoice.INDIVIDUAL.value, None):
            return f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}".strip()
        return self.reservation.reservee_organisation_name

    def get_instructions(
        self,
        *,
        kind: Literal["confirmed", "pending", "cancelled"],
        language: Lang,
    ) -> str:
        return "\n-\n".join(
            get_attr_by_language(reservation_unit, f"reservation_{kind}_instructions", language)
            for reservation_unit in self.reservation.reservation_units.all()
        )

    def calculate_full_price(
        self,
        begin_datetime: datetime.datetime,
        end_datetime: datetime.datetime,
        *,
        subsidised: bool = False,
    ) -> Decimal:
        # Currently, there is ever only one reservation unit per reservation
        reservation_unit: ReservationUnit | None = self.reservation.reservation_units.first()
        if reservation_unit is None:
            raise ValueError("Reservation has no reservation unit")

        pricing = reservation_unit.actions.get_pricing_on_date(date=begin_datetime.date())
        if pricing is None:
            raise ValueError("Reservation unit has no pricing information")

        if pricing.pricing_type == PricingType.FREE:
            return Decimal("0")

        price_unit = PriceUnit(pricing.price_unit)
        price = pricing.lowest_price if subsidised else pricing.highest_price

        # Time-based calculation is needed only if price unit is not fixed.
        # Otherwise, we can just use the price defined in the reservation unit
        if price_unit in PriceUnit.fixed_price_units:
            return price

        # Price calculations use duration rounded to the next 15 minutes
        duration_seconds = int((end_datetime - begin_datetime).total_seconds())
        duration_minutes = int(math.ceil(duration_seconds / 60 / 15) * 15)

        return (price / price_unit.in_minutes) * duration_minutes
