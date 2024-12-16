from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from tilavarauspalvelu.enums import EmailType, WeekdayChoice
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_application_section_cancelled,
    get_context_for_permission_deactivation,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_seasonal_reservation_cancelled_single,
    get_context_for_seasonal_reservation_modified_series,
    get_context_for_seasonal_reservation_modified_single,
    get_context_for_seasonal_reservation_rejected_series,
    get_context_for_seasonal_reservation_rejected_single,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
    get_context_for_user_anonymization,
)
from tilavarauspalvelu.integrations.email.template_context.application import (
    get_context_for_staff_notification_application_section_cancelled,
)
from tilavarauspalvelu.integrations.email.template_context.common import get_staff_reservations_ext_link
from tilavarauspalvelu.translation import get_translated
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_mock_data",
]


@get_translated
def get_mock_data(*, email_type: EmailType, language: Lang, **kwargs: Any) -> EmailContext | None:  # noqa: PLR0912, PLR0911
    email_recipient_name = kwargs.get("email_recipient_name", "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]")
    reservee_name = kwargs.get("reservee_name", "[VARAAJAN NIMI]")
    reservation_name = kwargs.get("reservation_name", "[VARAUKSEN NIMI]")
    cancel_reason = kwargs.get("cancel_reason", "[PERUUTUKSEN SYY]")
    rejection_reason = kwargs.get("rejection_reason", "[HYLKÄYKSEN SYY]")
    reservation_unit_name = kwargs.get("reservation_unit_name", "[VARAUSYKSIKÖN NIMI]")
    unit_name = kwargs.get("unit_name", "[TOIMIPISTEEN NIMI]")
    unit_location = kwargs.get("unit_location", "[TOIMIPISTEEN OSOITE]")
    begin = kwargs.get("begin", local_datetime())
    end = kwargs.get("end", begin + datetime.timedelta(days=1, hours=3))
    price = kwargs.get("price", Decimal("12.30"))
    subsidised_price = kwargs.get("subsidised_price", Decimal("10.30"))
    non_subsidised_price = kwargs.get("non_subsidised_price", Decimal("15.30"))
    applying_for_free_of_charge = kwargs.get("applying_for_free_of_charge", True)
    payment_due_date = kwargs.get("payment_due_date", end.date())
    tax_percentage = kwargs.get("tax_percentage", Decimal("25.5"))
    reservation_id = kwargs.get("reservation_id", 1234)
    confirmed_instructions = kwargs.get("confirmed_instructions", "[HYVÄKSYTYN VARAUKSEN OHJEET]")
    cancelled_instructions = kwargs.get("cancelled_instructions", "[PERUUTETUN VARAUKSEN OHJEET]")
    pending_instructions = kwargs.get("pending_instructions", "[KÄSITELTÄVÄN VARAUKSEN OHJEET]")
    weekday_value = kwargs.get("weekday_value", str(WeekdayChoice.MONDAY.label))
    time_value = kwargs.get("time_value", "13:00-15:00")
    application_section_name = kwargs.get("application_section_name", "[HAKEMUKSEN OSAN NIMI]")
    application_round_name = kwargs.get("application_round_name", "[KAUSIVARAUSKIERROKSEN NIMI]")
    cancelled_reservation_series = kwargs.get(
        "cancelled_reservation_series",
        [
            {
                "weekday": str(WeekdayChoice.MONDAY.label),
                "time": "13:00-15:00",
                "url": get_staff_reservations_ext_link(reservation_id=1234),
            },
            {
                "weekday": str(WeekdayChoice.TUESDAY.label),
                "time": "21:00-22:00",
                "url": get_staff_reservations_ext_link(reservation_id=5678),
            },
        ],
    )

    match email_type:
        # Application ##################################################################################################

        case EmailType.APPLICATION_HANDLED:
            return get_context_for_application_handled(language=language)
        case EmailType.APPLICATION_IN_ALLOCATION:
            return get_context_for_application_in_allocation(language=language)
        case EmailType.APPLICATION_RECEIVED:
            return get_context_for_application_received(language=language)

        case EmailType.APPLICATION_SECTION_CANCELLED:
            return get_context_for_application_section_cancelled(
                email_recipient_name=email_recipient_name,
                weekday_value=weekday_value,
                time_value=time_value,
                application_section_name=application_section_name,
                application_round_name=application_round_name,
                cancel_reason=cancel_reason,
                language=language,
            )

        # Permissions ##################################################################################################

        case EmailType.PERMISSION_DEACTIVATION:
            return get_context_for_permission_deactivation(language=language)
        case EmailType.USER_ANONYMIZATION:
            return get_context_for_user_anonymization(language=language)

        # Reservation ##################################################################################################

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
                reservation_id=reservation_id,
                instructions=confirmed_instructions,
                language=language,
            )
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
                reservation_id=reservation_id,
                instructions=cancelled_instructions,
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
                reservation_id=reservation_id,
                instructions=confirmed_instructions,
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
                reservation_id=reservation_id,
                instructions=confirmed_instructions,
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
                reservation_id=reservation_id,
                instructions=cancelled_instructions,
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
                reservation_id=reservation_id,
                instructions=pending_instructions,
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
                reservation_id=reservation_id,
                instructions=confirmed_instructions,
                language=language,
            )

        case EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE:
            return get_context_for_seasonal_reservation_cancelled_single(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                cancel_reason=cancel_reason,
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES:
            return get_context_for_seasonal_reservation_modified_series(
                email_recipient_name=email_recipient_name,
                weekday_value=weekday_value,
                time_value=time_value,
                application_section_name=application_section_name,
                application_round_name=application_round_name,
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE:
            return get_context_for_seasonal_reservation_modified_single(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_REJECTED_SERIES:
            return get_context_for_seasonal_reservation_rejected_series(
                email_recipient_name=email_recipient_name,
                weekday_value=weekday_value,
                time_value=time_value,
                application_section_name=application_section_name,
                application_round_name=application_round_name,
                rejection_reason=rejection_reason,
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE:
            return get_context_for_seasonal_reservation_rejected_single(
                email_recipient_name=email_recipient_name,
                reservation_unit_name=reservation_unit_name,
                unit_name=unit_name,
                unit_location=unit_location,
                begin_datetime=begin,
                end_datetime=end,
                rejection_reason=rejection_reason,
                language=language,
            )

        # Staff ########################################################################################################

        case EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED:
            return get_context_for_staff_notification_application_section_cancelled(
                application_section_name=application_section_name,
                application_round_name=application_round_name,
                cancel_reason=cancel_reason,
                cancelled_reservation_series=cancelled_reservation_series,
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
                reservation_id=reservation_id,
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
                reservation_id=reservation_id,
                language=language,
            )

        case _:
            return None
