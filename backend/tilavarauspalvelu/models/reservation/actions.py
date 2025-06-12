from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING, Literal

from django.conf import settings
from django.utils.translation import pgettext
from icalendar import Calendar, Event, Timezone, TimezoneDaylight, TimezoneStandard
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import (
    CalendarProperty,
    EventProperty,
    OrderStatus,
    PaymentType,
    ReservationStateChoice,
    ReserveeType,
    TimezoneProperty,
    TimezoneRuleProperty,
)
from tilavarauspalvelu.exceptions import ReservationPriceCalculationError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.helpers import (
    create_mock_verkkokauppa_order,
    get_verkkokauppa_order_params,
)
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CreateOrderError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import ApplicationSection, PaymentOrder, Reservation, ReservationMetadataField
from tilavarauspalvelu.translation import get_attr_by_language, get_translated
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.integrations.verkkokauppa.order.types import Order
    from tilavarauspalvelu.models import ReservationUnit, Unit
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
    from tilavarauspalvelu.typing import Lang


__all__ = [
    "ReservationActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationActions:
    reservation: Reservation

    def get_actual_before_buffer(self) -> datetime.timedelta:
        buffer_time_before: datetime.timedelta = self.reservation.buffer_time_before or datetime.timedelta()
        reservation_unit = self.reservation.reservation_unit
        before = reservation_unit.actions.get_actual_before_buffer(self.reservation.begins_at)
        return max(before, buffer_time_before)

    def get_actual_after_buffer(self) -> datetime.timedelta:
        buffer_time_after: datetime.timedelta = self.reservation.buffer_time_after or datetime.timedelta()
        reservation_unit = self.reservation.reservation_unit
        after = reservation_unit.actions.get_actual_after_buffer(self.reservation.ends_at)
        return max(after, buffer_time_after)

    def to_ical(self) -> bytes:
        language = self.reservation.user.get_preferred_language()

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

        unit: Unit = self.reservation.reservation_unit.unit

        site_name = str(settings.EMAIL_VARAAMO_EXT_LINK).removesuffix("/")
        # This should be unique such that if another iCal file is created
        # for the same reservation, it will be the same as the previous one.
        uid = f"varaamo.reservation.{self.reservation.pk}@{site_name}"
        summary = self.get_ical_summary(language=language)
        description = self.get_ical_description(site_name=site_name, language=language)

        ical_event.add(name=EventProperty.UID, value=uid)
        ical_event.add(name=EventProperty.DTSTAMP, value=local_datetime())
        ical_event.add(name=EventProperty.DTSTART, value=self.reservation.begins_at.astimezone(DEFAULT_TIMEZONE))
        ical_event.add(name=EventProperty.DTEND, value=self.reservation.ends_at.astimezone(DEFAULT_TIMEZONE))

        ical_event.add(name=EventProperty.SUMMARY, value=summary)
        ical_event.add(name=EventProperty.DESCRIPTION, value=description, parameters={"FMTTYPE": "text/html"})
        ical_event.add(name=EventProperty.X_ALT_DESC, value=description, parameters={"FMTTYPE": "text/html"})

        ical_event.add(name=EventProperty.LOCATION, value=unit.address)
        if unit.coordinates is not None:
            ical_event.add(name=EventProperty.GEO, value=(unit.lat, unit.lon))

        return ical_event

    @get_translated
    def get_ical_summary(self, *, language: Lang = "fi") -> str:
        unit: Unit = self.reservation.reservation_unit.unit
        unit_name = get_attr_by_language(unit, "name", language)
        return pgettext("ICAL", "Reservation for %(name)s") % {"name": unit_name}

    @get_translated
    def get_ical_description(self, *, site_name: str, language: Lang = "fi") -> str:
        reservation_unit: ReservationUnit = self.reservation.reservation_unit
        unit: Unit = reservation_unit.unit
        begin = self.reservation.begins_at.astimezone(DEFAULT_TIMEZONE)
        end = self.reservation.ends_at.astimezone(DEFAULT_TIMEZONE)

        title = pgettext("ICAL", "Booking details")
        reservation_unit_name = get_attr_by_language(reservation_unit, "name", language)
        unit_name = get_attr_by_language(unit, "name", language)
        address = unit.address
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

        text = pgettext("ICAL", "My bookings")
        text = f"{text!r}"
        link = f"<a href='{site_name}/reservations'>" + text + "</a>"

        footer = pgettext(
            "ICAL",
            # NOTE: Must format like this (not in braces '()' for example) so that translations pick it up.
            "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
            "terms of contract and cancellation on the %(my_bookings)s page.",
        ) % {
            "my_bookings": link,
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

    def get_email_reservee_name(self) -> str:
        # Note: Different from 'reservation.reservee_name' (simpler, mainly)
        if self.reservation.reservee_type in {ReserveeType.INDIVIDUAL.value, None}:
            return f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}".strip()
        return self.reservation.reservee_organisation_name

    def get_instructions(self, *, kind: Literal["confirmed", "pending", "cancelled"], language: Lang) -> str:
        return get_attr_by_language(self.reservation.reservation_unit, f"reservation_{kind}_instructions", language)

    def calculate_full_price(
        self,
        begin_datetime: datetime.datetime,
        end_datetime: datetime.datetime,
        *,
        subsidised: bool = False,
    ) -> Decimal:
        # Currently, there is ever only one reservation unit per reservation
        reservation_unit: ReservationUnit | None = self.reservation.reservation_unit
        if reservation_unit is None:
            msg = "Reservation has no reservation unit"
            raise ReservationPriceCalculationError(msg)

        pricing = reservation_unit.actions.get_active_pricing(by_date=begin_datetime.date())
        if pricing is None:
            msg = "Reservation unit has no pricing information"
            raise ReservationPriceCalculationError(msg)

        duration = end_datetime - begin_datetime
        return pricing.actions.calculate_reservation_price(duration, subsidised=subsidised)

    def get_application_section(self) -> ApplicationSection | None:
        return ApplicationSection.objects.filter(
            reservation_unit_options__allocated_time_slots__reservation_series__reservations=self.reservation
        ).first()

    def get_state_on_reservation_confirmed(self, payment_type: PaymentType | None) -> ReservationStateChoice:
        if self.reservation.requires_handling:
            return ReservationStateChoice.REQUIRES_HANDLING

        if self.reservation.price_net > 0 and payment_type != PaymentType.ON_SITE:
            return ReservationStateChoice.WAITING_FOR_PAYMENT

        return ReservationStateChoice.CONFIRMED

    def get_required_fields(
        self,
        *,
        reservee_type: ReserveeType | None = None,
    ) -> list[str]:
        if reservee_type is None:
            reservee_type = self.reservation.reservee_type

        qs = ReservationMetadataField.objects.filter(
            metadata_sets_required__reservation_units__reservations=self.reservation,
        )

        # Some fields are never mandatory for an individual reserver even if marked so in the metadata.
        if reservee_type == ReserveeType.INDIVIDUAL:
            qs = qs.exclude(field_name__in=["reservee_identifier", "reservee_organisation_name"])

        # Reservee identifier is optional for non-profit reservers (they can be unregistered)
        if reservee_type == ReserveeType.NONPROFIT:
            qs = qs.exclude(field_name__in=["reservee_identifier"])

        return list(qs.distinct().order_by("field_name").values_list("field_name", flat=True))

    def create_payment_order_paid_immediately(self, payment_type: PaymentType) -> PaymentOrder:
        if payment_type == PaymentType.ON_SITE:
            return self.reservation.actions.create_payment_order_paid_on_site()
        return self.reservation.actions.create_payment_order_paid_online(payment_type)

    def create_payment_order_paid_after_handling(
        self,
        payment_type: PaymentType,
        handled_payment_due_by: datetime.datetime,
    ) -> PaymentOrder:
        if payment_type == PaymentType.ON_SITE:
            return self.reservation.actions.create_payment_order_paid_on_site()

        return self.reservation.actions.create_payment_order_pending_after_handling(
            payment_type=payment_type,
            handled_payment_due_by=handled_payment_due_by,
        )

    def create_payment_order_paid_online(self, payment_type: PaymentType) -> PaymentOrder:
        if payment_type not in PaymentType.requires_verkkokauppa:
            msg = f"Payment type {payment_type!r} cannot be paid online"
            raise ValidationError(msg)

        verkkokauppa_order = self.create_order_in_verkkokauppa()

        return PaymentOrder.objects.create(
            payment_type=payment_type,
            status=OrderStatus.DRAFT,
            language=self.reservation.user.get_preferred_language(),
            price_net=self.reservation.price_net,
            price_vat=self.reservation.price_vat_amount,
            price_total=self.reservation.price,
            reservation=self.reservation,
            reservation_user_uuid=self.reservation.user.uuid,
            remote_id=verkkokauppa_order.order_id,
            checkout_url=verkkokauppa_order.checkout_url,
            receipt_url=verkkokauppa_order.receipt_url,
        )

    def create_payment_order_paid_on_site(self) -> PaymentOrder:
        return PaymentOrder.objects.create(
            payment_type=PaymentType.ON_SITE,
            status=OrderStatus.PAID_MANUALLY,
            language=self.reservation.user.get_preferred_language(),
            price_net=self.reservation.price_net,
            price_vat=self.reservation.price_vat_amount,
            price_total=self.reservation.price,
            reservation=self.reservation,
        )

    def create_payment_order_pending_after_handling(
        self,
        payment_type: PaymentType,
        handled_payment_due_by: datetime.datetime,
    ) -> PaymentOrder:
        if payment_type not in PaymentType.types_that_can_be_pending:
            msg = f"Payment type {payment_type!r} cannot have a pending payment order"
            raise ValidationError(msg)

        return PaymentOrder.objects.create(
            payment_type=payment_type,
            status=OrderStatus.PENDING,
            language=self.reservation.user.get_preferred_language(),
            price_net=self.reservation.price_net,
            price_vat=self.reservation.price_vat_amount,
            price_total=self.reservation.price,
            reservation=self.reservation,
            handled_payment_due_by=handled_payment_due_by,
        )

    def create_order_in_verkkokauppa(self) -> Order:
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            return create_mock_verkkokauppa_order(self.reservation)

        invoicing_date: datetime.date | None = None
        if self.should_offer_invoicing():
            invoicing_date = self.reservation.begins_at.date()

        order_params = get_verkkokauppa_order_params(self.reservation, invoicing_date=invoicing_date)

        try:
            return VerkkokauppaAPIClient.create_order(order_params=order_params)
        except CreateOrderError as err:
            sentry_msg = "Creating order in Verkkokauppa failed"
            SentryLogger.log_exception(err, details=sentry_msg, reservation_id=self.reservation.pk)
            msg = "Upstream service call failed. Unable to confirm the reservation."
            raise ValidationError(msg, code=error_codes.UPSTREAM_CALL_FAILED) from err

    def overlapping_reservations(self) -> ReservationQuerySet:
        """Find all reservations that overlap with this reservation."""
        reservation_unit = self.reservation.reservation_unit
        return Reservation.objects.overlapping_reservations(
            reservation_unit=reservation_unit,
            begin=self.reservation.begins_at,
            end=self.reservation.ends_at,
            buffer_time_before=self.reservation.buffer_time_before,
            buffer_time_after=self.reservation.buffer_time_after,
        ).exclude(id=self.reservation.id)

    def should_offer_invoicing(self) -> bool:
        if self.reservation.reservee_type is None:
            return False

        reservee_type = ReserveeType(self.reservation.reservee_type)
        if reservee_type not in ReserveeType.organisation_types:
            return False

        if reservee_type == ReserveeType.NONPROFIT and not self.reservation.reservee_identifier:
            return False

        reservation_unit: ReservationUnit = self.reservation.reservation_unit

        pricing = reservation_unit.actions.get_active_pricing(by_date=self.reservation.begins_at.date())
        if pricing is None:
            return False

        if pricing.payment_type != PaymentType.ONLINE_OR_INVOICE:
            return False

        accounting = reservation_unit.actions.get_accounting()
        if accounting is None:
            return False

        return accounting.actions.supports_invoicing()
