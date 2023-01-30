import datetime
from decimal import Decimal
from typing import Dict

from django.utils.timezone import get_default_timezone

from applications.models import CUSTOMER_TYPES
from email_notification.email_tester import EmailTestForm
from reservations.models import Reservation


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
    confirmed_instructions: Dict[str, str]
    pending_instructions: Dict[str, str]
    cancelled_instructions: Dict[str, str]
    deny_reason: Dict[str, str]
    cancel_reason: Dict[str, str]
    reservee_language: str

    def _get_by_language(self, instance, field, language):
        return getattr(instance, f"{field}_{language}", getattr(instance, field, ""))

    def _get_reservation_unit_instruction_field(self, reservation, name, language):
        instructions = []
        for res_unit in reservation.reservation_unit.all():
            instructions.append(self._get_by_language(res_unit, name, language))

        return "\n-\n".join(instructions)

    @staticmethod
    def from_reservation(reservation: Reservation) -> "EmailNotificationContext":
        """Build context from reservation"""
        context = EmailNotificationContext()

        if (
            not reservation.reservee_type
            or reservation.reservee_type == CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL
        ):
            context.reservee_name = (
                f"{reservation.reservee_first_name} {reservation.reservee_last_name}"
            )
        else:
            context.reservee_name = reservation.reservee_organisation_name

        context.begin_datetime = reservation.begin.astimezone(get_default_timezone())
        context.end_datetime = reservation.end.astimezone(get_default_timezone())
        context.reservation_number = reservation.id

        res_unit = reservation.reservation_unit.filter(unit__isnull=False).first()
        location = getattr(res_unit.unit, "location", None)
        if location:
            context.unit_location = f"{location.address_street} {location.address_zip} {location.address_city}"
        else:
            context.unit_location = None

        if res_unit:
            context.unit_name = res_unit.unit.name

        context.reservation_name = reservation.name

        if reservation.reservation_unit.count() > 1:
            context.reservation_unit_name = ", ".join(
                reservation.reservation_unit.values_list("name", flat=True)
            )
        else:
            context.reservation_unit_name = reservation.reservation_unit.first().name

        context.price = reservation.price
        context.non_subsidised_price = reservation.non_subsidised_price

        if not reservation.applying_for_free_of_charge:
            context.subsidised_price = reservation.price
        else:
            from api.graphql.reservations.reservation_serializers.mixins import (
                ReservationPriceMixin,
            )

            calculator = ReservationPriceMixin()
            prices = calculator.calculate_price(
                reservation.begin,
                reservation.end,
                reservation.reservation_unit.all(),
            )
            context.subsidised_price = prices.subsidised_price

        context.tax_percentage = reservation.tax_percentage_value
        context.reservee_language = reservation.reservee_language
        context.confirmed_instructions = {
            "fi": context._get_reservation_unit_instruction_field(
                reservation, "reservation_confirmed_instructions", "fi"
            ),
            "sv": context._get_reservation_unit_instruction_field(
                reservation, "reservation_confirmed_instructions", "sv"
            ),
            "en": context._get_reservation_unit_instruction_field(
                reservation, "reservation_confirmed_instructions", "en"
            ),
        }
        context.pending_instructions = {
            "fi": context._get_reservation_unit_instruction_field(
                reservation, "reservation_pending_instructions", "fi"
            ),
            "sv": context._get_reservation_unit_instruction_field(
                reservation, "reservation_pending_instructions", "sv"
            ),
            "en": context._get_reservation_unit_instruction_field(
                reservation, "reservation_pending_instructions", "en"
            ),
        }
        context.cancelled_instructions = {
            "fi": context._get_reservation_unit_instruction_field(
                reservation, "reservation_cancelled_instructions", "fi"
            ),
            "sv": context._get_reservation_unit_instruction_field(
                reservation, "reservation_cancelled_instructions", "sv"
            ),
            "en": context._get_reservation_unit_instruction_field(
                reservation, "reservation_cancelled_instructions", "en"
            ),
        }
        context.deny_reason = {
            "fi": context._get_by_language(reservation.deny_reason, "reason", "fi"),
            "sv": context._get_by_language(reservation.deny_reason, "reason", "sv"),
            "en": context._get_by_language(reservation.deny_reason, "reason", "en"),
        }
        context.cancel_reason = {
            "fi": context._get_by_language(reservation.cancel_reason, "reason", "fi"),
            "sv": context._get_by_language(reservation.cancel_reason, "reason", "sv"),
            "en": context._get_by_language(reservation.cancel_reason, "reason", "en"),
        }
        return context

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
