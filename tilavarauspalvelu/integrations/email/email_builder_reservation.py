from __future__ import annotations

import datetime
from dataclasses import dataclass
from decimal import Decimal
from typing import TYPE_CHECKING, Literal
from urllib.parse import urljoin

from django.conf import settings
from django.utils.timezone import get_default_timezone

from tilavarauspalvelu.enums import CustomerTypeChoice, EmailType
from tilavarauspalvelu.integrations.email.email_builder_base import BaseEmailBuilder, BaseEmailContext, EmailAttachment
from utils.date_utils import local_date
from utils.utils import get_attr_by_language

if TYPE_CHECKING:
    from config.utils.commons import LanguageType
    from tilavarauspalvelu.admin.email_template.tester import EmailTemplateTesterForm
    from tilavarauspalvelu.models import EmailTemplate, Location
from tilavarauspalvelu.models import Reservation
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from config.utils.commons import LanguageType
    from tilavarauspalvelu.models import Location

type InstructionNameType = Literal["confirmed", "pending", "cancelled"]


@dataclass
class ReservationEmailContext(BaseEmailContext):
    reservee_name: str
    name: str
    reservation_number: int
    reservation_unit: str
    unit_name: str
    unit_location: str

    begin_date: str
    begin_time: str
    end_date: str
    end_time: str

    price: Decimal
    non_subsidised_price: Decimal
    subsidised_price: Decimal
    tax_percentage: Decimal
    payment_due_date: str

    confirmed_instructions: str
    pending_instructions: str
    cancelled_instructions: str

    deny_reason: str
    cancel_reason: str

    my_reservations_ext_link: str
    staff_reservations_ext_link: str

    # Builders
    @classmethod
    def from_reservation(
        cls,
        reservation: Reservation,
        forced_language: LanguageType | None = None,
    ) -> ReservationEmailContext:
        language = settings.LANGUAGE_CODE
        if forced_language:
            language = forced_language
        elif reservation.reservee_language:
            language = reservation.reservee_language
        elif reservation.user and reservation.user.preferred_language:
            language = reservation.user.preferred_language

        unit = getattr(reservation.reservation_unit.filter(unit__isnull=False).first(), "unit", None)
        location: Location | None = getattr(unit, "location", None)

        begin_datetime = reservation.begin.astimezone(get_default_timezone())
        end_datetime = reservation.end.astimezone(get_default_timezone())

        return ReservationEmailContext(
            # Reservation details
            reservee_name=cls._get_reservation_reservee_name(reservation),
            name=reservation.name,
            reservation_number=reservation.id,
            reservation_unit=cls._get_reservation_reservation_unit_name(reservation, language),
            unit_name=get_attr_by_language(unit, "name", language),
            unit_location=str(location) if location is not None else "",
            # Dates and times
            begin_date=begin_datetime.strftime("%-d.%-m.%Y"),
            begin_time=begin_datetime.strftime("%H:%M"),
            end_date=end_datetime.strftime("%-d.%-m.%Y"),
            end_time=end_datetime.strftime("%H:%M"),
            # Prices
            price=reservation.price,
            non_subsidised_price=reservation.non_subsidised_price,
            subsidised_price=cls._get_reservation_subsidised_price(reservation),
            tax_percentage=reservation.tax_percentage_value,
            payment_due_date=local_date().strftime("%-d.%-m.%Y"),
            # Instructions
            confirmed_instructions=cls._get_instruction_field(reservation, "confirmed", language),
            pending_instructions=cls._get_instruction_field(reservation, "pending", language),
            cancelled_instructions=cls._get_instruction_field(reservation, "cancelled", language),
            # Reasons
            deny_reason=get_attr_by_language(reservation.deny_reason, "reason", language),
            cancel_reason=get_attr_by_language(reservation.cancel_reason, "reason", language),
            # Links
            my_reservations_ext_link=cls._get_my_reservations_ext_link(language),
            staff_reservations_ext_link=cls._get_staff_reservations_ext_link(),
            **cls._get_common_kwargs(language),
        )

    @classmethod
    def from_form(cls, form: EmailTemplateTesterForm, language: LanguageType) -> ReservationEmailContext:
        """
        Create context from form data.
        This is used for testing email notifications.
        """
        return ReservationEmailContext(
            # Reservation details
            reservee_name=form.cleaned_data["reservee_name"],
            name=form.cleaned_data["reservation_name"],
            reservation_number=form.cleaned_data["reservation_number"],
            reservation_unit=form.cleaned_data["reservation_unit_name"],
            unit_name=form.cleaned_data["unit_name"],
            unit_location=form.cleaned_data["unit_location"],
            # Dates and times
            begin_date=form.cleaned_data["begin_datetime"].strftime("%-d.%-m.%Y"),
            begin_time=form.cleaned_data["begin_datetime"].strftime("%H:%M"),
            end_date=form.cleaned_data["end_datetime"].strftime("%-d.%-m.%Y"),
            end_time=form.cleaned_data["end_datetime"].strftime("%H:%M"),
            # Prices
            price=form.cleaned_data["price"],
            non_subsidised_price=form.cleaned_data["non_subsidised_price"],
            subsidised_price=form.cleaned_data["subsidised_price"],
            tax_percentage=form.cleaned_data["tax_percentage"],
            payment_due_date=form.cleaned_data["payment_due_date"].strftime("%-d.%-m.%Y"),
            # Instructions
            confirmed_instructions=form.cleaned_data[f"confirmed_instructions_{language}"],
            pending_instructions=form.cleaned_data[f"pending_instructions_{language}"],
            cancelled_instructions=form.cleaned_data[f"cancelled_instructions_{language}"],
            # Reasons
            deny_reason=form.cleaned_data[f"deny_reason_{language}"],
            cancel_reason=form.cleaned_data[f"cancel_reason_{language}"],
            # Links
            my_reservations_ext_link=cls._get_my_reservations_ext_link(language),
            staff_reservations_ext_link=cls._get_staff_reservations_ext_link(),
            # Common
            **cls._get_common_kwargs(language),
        )

    @classmethod
    def from_mock_data(cls) -> ReservationEmailContext:
        """Used to validate the email template content in Django Admin."""
        language = settings.LANGUAGE_CODE
        begin_datetime = datetime.datetime(2100, 1, 1, 12, 00)
        end_datetime = datetime.datetime(2100, 1, 1, 13, 15)
        return ReservationEmailContext(
            # Reservation details
            reservee_name="Test Email",
            name="TESTIVARAUS",
            reservation_number=1234567,
            reservation_unit="VARAUSYKSIKKÖ",
            unit_name="TOIMIPISTE",
            unit_location="Testikatu 99999 Korvatunturi",
            # Dates and times
            begin_date=begin_datetime.strftime("%-d.%-m.%Y"),
            begin_time=begin_datetime.strftime("%H:%M"),
            end_date=end_datetime.strftime("%-d.%-m.%Y"),
            end_time=end_datetime.strftime("%H:%M"),
            # Prices
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("15.00"),
            subsidised_price=Decimal("5.00"),
            tax_percentage=Decimal("25.5"),
            payment_due_date=begin_datetime.strftime("%-d.%-m.%Y"),
            # Instructions
            confirmed_instructions="[lisäohje: hyväksytty]",
            pending_instructions="[lisäohje: käsittelyssä]",
            cancelled_instructions="[lisäohje: peruttu]",
            # Reasons
            deny_reason="[syy: hylätty]",
            cancel_reason="[syy: peruttu]",
            # Links
            my_reservations_ext_link=cls._get_my_reservations_ext_link(language),
            staff_reservations_ext_link=cls._get_staff_reservations_ext_link(),
            # Common
            **cls._get_common_kwargs(language),
        )

    # Helpers
    @staticmethod
    def _get_reservation_reservee_name(reservation: Reservation) -> str:
        # Intentionally don't use reservation.reservee_name here
        if not reservation.reservee_type or reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value:
            return f"{reservation.reservee_first_name} {reservation.reservee_last_name}".strip()
        return reservation.reservee_organisation_name

    @staticmethod
    def _get_reservation_reservation_unit_name(reservation: Reservation, language: LanguageType) -> str:
        """In case of multiple reservation units, return a comma separated list of names"""
        return ", ".join([get_attr_by_language(ru, "name", language) for ru in reservation.reservation_unit.all()])

    @staticmethod
    def _get_reservation_subsidised_price(reservation: Reservation) -> Decimal:
        from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import ReservationPriceMixin

        if not reservation.applying_for_free_of_charge:
            return reservation.price

        calculator = ReservationPriceMixin()
        prices = calculator.calculate_price(
            reservation.begin,
            reservation.end,
            reservation.reservation_unit.all(),
        )
        return prices.subsidised_price

    @staticmethod
    def _get_instruction_field(reservation: Reservation, name: InstructionNameType, language: LanguageType) -> str:
        """Get instructions of requested type for all related reservation units in selected language"""
        return "\n-\n".join(
            [
                get_attr_by_language(reservation_unit, f"reservation_{name}_instructions", language)
                for reservation_unit in reservation.reservation_unit.all()
            ]
        )

    @staticmethod
    def _get_my_reservations_ext_link(language: LanguageType) -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK
        if language.lower() != "fi":
            url_base = urljoin(url_base, language) + "/"
        return urljoin(url_base, "reservations")

    @staticmethod
    def _get_staff_reservations_ext_link() -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK
        return urljoin(url_base, "kasittely/reservations")


class ReservationEmailBuilder(BaseEmailBuilder):
    context: ReservationEmailContext

    email_template_types = [
        EmailType.RESERVATION_CANCELLED,
        EmailType.RESERVATION_CONFIRMED,
        EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
        EmailType.RESERVATION_HANDLING_REQUIRED,
        EmailType.RESERVATION_MODIFIED,
        EmailType.RESERVATION_NEEDS_TO_BE_PAID,
        EmailType.RESERVATION_REJECTED,
        EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
        EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
    ]

    def __init__(self, *, template: EmailTemplate, context: ReservationEmailContext) -> None:
        super().__init__(template=template, context=context)

    @classmethod
    def from_reservation(
        cls,
        *,
        template: EmailTemplate,
        reservation: Reservation,
        forced_language: LanguageType | None = None,
    ) -> ReservationEmailBuilder:
        return ReservationEmailBuilder(
            template=template,
            context=ReservationEmailContext.from_reservation(reservation, forced_language=forced_language),
        )

    @classmethod
    def from_form(
        cls, *, template: EmailTemplate, form: EmailTemplateTesterForm, language: LanguageType
    ) -> ReservationEmailBuilder:
        return ReservationEmailBuilder(
            template=template,
            context=ReservationEmailContext.from_form(form, language),
        )

    @classmethod
    def from_mock_data(cls, *, template: EmailTemplate) -> ReservationEmailBuilder:
        return ReservationEmailBuilder(template=template, context=ReservationEmailContext.from_mock_data())

    def get_attachment(self) -> EmailAttachment | None:
        if self.template.type not in [
            EmailType.RESERVATION_CONFIRMED,
            EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
            EmailType.RESERVATION_MODIFIED,
        ]:
            return None

        reservation: Reservation | None = Reservation.objects.filter(id=self.context.reservation_number).first()
        if reservation is None:
            return None

        try:
            ical = reservation.actions.to_ical()
        except Exception as exc:
            SentryLogger.log_exception(exc, "Failed to generate iCal attachment for reservation")
            return None

        return EmailAttachment(
            filename="reservation_calendar.ics",
            content=ical.decode("utf-8"),
            mimetype="text/calendar",
        )
