import datetime
from decimal import Decimal

from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_permission_deactivation,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
)
from tilavarauspalvelu.typing import EmailContext, Lang
from utils.date_utils import local_datetime

__all__ = [
    "get_mock_data",
]


def get_mock_data(*, email_type: EmailType, language: Lang) -> EmailContext | None:  # noqa: PLR0912, PLR0911
    email_recipient_name = "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]"
    reservee_name = "[VARAAJAN NIMI]"
    reservation_name = "[VARAUKSEN NIMI]"
    cancel_reason = "[PERUUTUKSEN SYY]"
    rejection_reason = "[HYLKÄYKSEN SYY]"
    reservation_unit_name = "[VARAUSYKSIKÖN NIMI]"
    unit_name = "[TOIMIPISTEEN NIMI]"
    unit_location = "[TOIMIPISTEEN OSOITE]"
    begin = local_datetime()
    end = begin + datetime.timedelta(days=1, hours=3)
    price = Decimal("12.30")
    subsidised_price = Decimal("10.30")
    non_subsidised_price = Decimal("15.30")
    applying_for_free_of_charge = True
    payment_due_date = end.date()
    tax_percentage = Decimal("25.5")
    booking_number = 1234
    confirmed_instructions = "[HYVÄKSYTYN VARAUKSEN OHJEET]"
    cancelled_instructions = "[PERUUTETUN VARAUKSEN OHJEET]"
    pending_instructions = "[KÄSITELTÄVÄN VARAUKSEN OHJEET]"

    match email_type:
        case EmailType.APPLICATION_HANDLED:
            return get_context_for_application_handled(language=language)

        case EmailType.APPLICATION_IN_ALLOCATION:
            return get_context_for_application_in_allocation(language=language)

        case EmailType.APPLICATION_RECEIVED:
            return get_context_for_application_received(language=language)

        case EmailType.PERMISSION_DEACTIVATION:
            return get_context_for_permission_deactivation(language=language)

        case EmailType.RESERVATION_CANCELLED:
            return get_context_for_reservation_cancelled(
                email_recipient_name=email_recipient_name,
                cancel_reason=cancel_reason,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                price=price,
                tax_percentage=tax_percentage,
                booking_number=booking_number,
                cancelled_instructions=cancelled_instructions,
                language=language,
            )

        case EmailType.RESERVATION_CONFIRMED:
            return get_context_for_reservation_confirmed(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                price=price,
                tax_percentage=tax_percentage,
                booking_number=booking_number,
                confirmed_instructions=confirmed_instructions,
                language=language,
            )

        case EmailType.RESERVATION_APPROVED:
            return get_context_for_reservation_approved(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                price=price,
                non_subsidised_price=non_subsidised_price,
                tax_percentage=tax_percentage,
                booking_number=booking_number,
                confirmed_instructions=confirmed_instructions,
                language=language,
            )

        case EmailType.RESERVATION_REQUIRES_HANDLING:
            return get_context_for_reservation_requires_handling(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                price=price,
                subsidised_price=subsidised_price,
                applying_for_free_of_charge=applying_for_free_of_charge,
                tax_percentage=tax_percentage,
                booking_number=booking_number,
                pending_instructions=pending_instructions,
                language=language,
            )

        case EmailType.RESERVATION_MODIFIED:
            return get_context_for_reservation_modified(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                price=price,
                tax_percentage=tax_percentage,
                booking_number=booking_number,
                confirmed_instructions=confirmed_instructions,
                language=language,
            )

        case EmailType.RESERVATION_REQUIRES_PAYMENT:
            return get_context_for_reservation_requires_payment(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                price=price,
                tax_percentage=tax_percentage,
                payment_due_date=payment_due_date,
                booking_number=booking_number,
                confirmed_instructions=confirmed_instructions,
                language=language,
            )

        case EmailType.RESERVATION_REJECTED:
            return get_context_for_reservation_rejected(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                rejection_reason=rejection_reason,
                booking_number=booking_number,
                cancelled_instructions=cancelled_instructions,
                language=language,
            )

        case EmailType.STAFF_NOTIFICATION_RESERVATION_MADE:
            return get_context_for_staff_notification_reservation_made(
                reservee_name=reservee_name,
                reservation_name=reservation_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                booking_number=booking_number,
                language=language,
            )

        case EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING:
            return get_context_for_staff_notification_reservation_requires_handling(
                reservee_name=reservee_name,
                reservation_name=reservation_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                booking_number=booking_number,
                language=language,
            )

        case _:
            return None
