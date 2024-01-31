import datetime
from decimal import Decimal
from typing import Literal

from django.conf import settings
from django.utils.timezone import get_default_timezone

from common.utils import get_attr_by_language
from email_notification.email_tester import EmailTestForm
from reservations.choices import CustomerTypeChoice
from reservations.models import Reservation
from spaces.models import Location


class EmailNotificationContext:
    reservee_name: str
    begin_datetime: datetime.datetime
    end_datetime: datetime.datetime
    reservation_number: int
    unit_location: str
    unit_name: str
    reservation_name: str
    reservation_unit_name: str
    price: Decimal
    non_subsidised_price: Decimal
    subsidised_price: Decimal
    tax_percentage: int
    confirmed_instructions: dict[str, str]
    pending_instructions: dict[str, str]
    cancelled_instructions: dict[str, str]
    deny_reason: dict[str, str]
    cancel_reason: dict[str, str]
    reservee_language: str

    def _get_reservation_unit_instruction_fields(
        self,
        reservation: Reservation,
        name: Literal["confirmed", "pending", "cancelled"],
    ) -> dict[str, str]:
        """Get reservation unit instruction fields for all languages"""
        all_instructions: dict[str, str] = {
            "fi": "",
            "sv": "",
            "en": "",
        }
        reservation_units = reservation.reservation_units.all()

        for language in all_instructions:
            language_instructions: list[str] = []

            for ru in reservation_units:
                language_instructions.append(get_attr_by_language(ru, f"reservation_{name}_instructions", language))

            all_instructions[language] = "\n-\n".join(language_instructions)

        return all_instructions

    @staticmethod
    def with_mock_data() -> "EmailNotificationContext":
        """Initialize context with mock data"""
        context = EmailNotificationContext()
        context.reservee_name = "Email Test"
        context.begin_datetime = datetime.datetime(2100, 1, 1, 12, 00)
        context.end_datetime = datetime.datetime(2100, 1, 1, 13, 15)
        context.reservation_number = 1234567
        context.unit_location = "Testikatu 99999 Korvatunturi"
        context.unit_name = "TOIMIPISTE"
        context.reservation_name = "TESTIVARAUS"
        context.reservation_unit_name = "VARAUSYKSIKKÖ"
        context.price = Decimal("12.30")
        context.non_subsidised_price = Decimal("15.00")
        context.subsidised_price = Decimal("5.00")
        context.tax_percentage = 24
        context.confirmed_instructions = {
            "fi": "[lisäohje: hyväksytty]",
            "sv": "[mer information: bekräftats]",
            "en": "[additional info: confirmed]",
        }
        context.pending_instructions = {
            "fi": "[lisäohje: käsittelyssä]",
            "sv": "[mer information: kräver hantering]",
            "en": "[additional info: requires handling]",
        }
        context.cancelled_instructions = {
            "fi": "[lisäohje: peruttu]",
            "sv": "[mer information: avbokad]",
            "en": "[additional info: cancelled]",
        }
        context.deny_reason = {
            "fi": "[syy]",
            "sv": "[orsak]",
            "en": "[reason]",
        }
        context.cancel_reason = {
            "fi": "[syy]",
            "sv": "[orsak]",
            "en": "[reason]",
        }
        return context

    @staticmethod
    def from_reservation(reservation: Reservation) -> "EmailNotificationContext":
        """Build context from reservation"""
        context = EmailNotificationContext()

        context.reservation_name = reservation.name

        context.reservee_language = reservation.reservee_language
        language = reservation.reservee_language or getattr(
            reservation.user, "preferred_language", settings.LANGUAGE_CODE
        )

        # Intentionally don't use reservation.reservee_name here
        if not reservation.reservee_type or reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value:
            context.reservee_name = f"{reservation.reservee_first_name} {reservation.reservee_last_name}".strip()
        else:
            context.reservee_name = reservation.reservee_organisation_name

        context.begin_datetime = reservation.begin.astimezone(get_default_timezone())
        context.end_datetime = reservation.end.astimezone(get_default_timezone())
        context.reservation_number = reservation.id

        res_unit = reservation.reservation_units.filter(unit__isnull=False).first()
        context.unit_name = get_attr_by_language(res_unit.unit, "name", language) or ""

        location: Location | None = getattr(res_unit.unit, "location", None)
        context.unit_location = str(location) if location is not None else ""

        context.reservation_unit_name = ", ".join(
            [get_attr_by_language(ru, "name", language) for ru in reservation.reservation_units.all()]
        )

        context.price = reservation.price
        context.non_subsidised_price = reservation.non_subsidised_price

        if not reservation.applying_for_free_of_charge:
            context.subsidised_price = reservation.price
        else:
            from api.graphql.types.reservations.serializers.mixins import ReservationPriceMixin

            calculator = ReservationPriceMixin()
            prices = calculator.calculate_price(
                reservation.begin,
                reservation.end,
                reservation.reservation_units.all(),
            )
            context.subsidised_price = prices.subsidised_price

        context.tax_percentage = reservation.tax_percentage_value

        context.confirmed_instructions = context._get_reservation_unit_instruction_fields(reservation, "confirmed")
        context.pending_instructions = context._get_reservation_unit_instruction_fields(reservation, "pending")
        context.cancelled_instructions = context._get_reservation_unit_instruction_fields(reservation, "cancelled")
        context.deny_reason = {
            "fi": get_attr_by_language(reservation.deny_reason, "reason", "fi"),
            "sv": get_attr_by_language(reservation.deny_reason, "reason", "sv"),
            "en": get_attr_by_language(reservation.deny_reason, "reason", "en"),
        }
        context.cancel_reason = {
            "fi": get_attr_by_language(reservation.cancel_reason, "reason", "fi"),
            "sv": get_attr_by_language(reservation.cancel_reason, "reason", "sv"),
            "en": get_attr_by_language(reservation.cancel_reason, "reason", "en"),
        }
        return context

    @staticmethod
    def from_form(form: EmailTestForm) -> "EmailNotificationContext":
        context = EmailNotificationContext()
        context.reservee_name = form.cleaned_data["reservee_name"]
        context.begin_datetime = form.cleaned_data["begin_datetime"]
        context.end_datetime = form.cleaned_data["end_datetime"]
        context.reservation_number = form.cleaned_data["reservation_number"]
        context.unit_location = form.cleaned_data["unit_location"]
        context.unit_name = form.cleaned_data["unit_name"]
        context.reservation_name = form.cleaned_data["reservation_name"]
        context.reservation_unit_name = form.cleaned_data["reservation_unit_name"]
        context.price = form.cleaned_data["price"]
        context.non_subsidised_price = form.cleaned_data["non_subsidised_price"]
        context.subsidised_price = form.cleaned_data["subsidised_price"]
        context.tax_percentage = form.cleaned_data["tax_percentage"]
        context.confirmed_instructions = {
            "fi": form.cleaned_data["confirmed_instructions_fi"],
            "sv": form.cleaned_data["confirmed_instructions_sv"],
            "en": form.cleaned_data["confirmed_instructions_en"],
        }
        context.pending_instructions = {
            "fi": form.cleaned_data["pending_instructions_fi"],
            "sv": form.cleaned_data["pending_instructions_sv"],
            "en": form.cleaned_data["pending_instructions_en"],
        }
        context.cancelled_instructions = {
            "fi": form.cleaned_data["cancelled_instructions_fi"],
            "sv": form.cleaned_data["cancelled_instructions_sv"],
            "en": form.cleaned_data["cancelled_instructions_en"],
        }
        context.deny_reason = {
            "fi": form.cleaned_data["deny_reason_fi"],
            "sv": form.cleaned_data["deny_reason_sv"],
            "en": form.cleaned_data["deny_reason_en"],
        }
        context.cancel_reason = {
            "fi": form.cleaned_data["cancel_reason_fi"],
            "sv": form.cleaned_data["cancel_reason_sv"],
            "en": form.cleaned_data["cancel_reason_en"],
        }
        return context
