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
from tilavarauspalvelu.integrations.email.template_context.reservation import (
    get_context_for_reservation_modified_access_code,
)
from tilavarauspalvelu.translation import get_translated
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_mock_data",
    "get_mock_params",
]


@get_translated
def get_mock_params(**kwargs: Any) -> EmailContext | datetime | bool:
    """
    Return mock parameters that can be used for creating ANY email template context.

    Even parameters that are not used in the context of the email template are included,
    but the context only uses the parameters that are relevant to the email template.
    """
    begin = kwargs.get("begin_datetime", local_datetime())
    end = kwargs.get("end_datetime", begin + datetime.timedelta(hours=3))
    access_code_is_used = kwargs.get("access_code_is_used", False)

    return {
        "email_recipient_name": kwargs.get("email_recipient_name", "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]"),
        "reservee_name": kwargs.get("reservee_name", "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]"),
        "reservation_name": kwargs.get("reservation_name", "[VARAUKSEN NIMI]"),
        "cancel_reason": kwargs.get("cancel_reason", "[PERUUTUKSEN SYY]"),
        "rejection_reason": kwargs.get("rejection_reason", "[HYLKÄYKSEN SYY]"),
        "reservation_unit_name": kwargs.get("reservation_unit_name", "[VARAUSYKSIKÖN NIMI]"),
        "unit_name": kwargs.get("unit_name", "[TOIMIPISTEEN NIMI]"),
        "unit_location": kwargs.get("unit_location", "[TOIMIPISTEEN OSOITE], [KAUPUNKI]"),
        "begin_datetime": begin,
        "end_datetime": end,
        "price": kwargs.get("price", Decimal("12.30")),
        "subsidised_price": kwargs.get("subsidised_price", Decimal("10.00")),
        "non_subsidised_price": kwargs.get("non_subsidised_price", Decimal("12.30")),
        "applying_for_free_of_charge": kwargs.get("applying_for_free_of_charge", True),
        "payment_due_date": kwargs.get("payment_due_date", end.date()),
        "tax_percentage": kwargs.get("tax_percentage", Decimal("25.5")),
        "reservation_id": kwargs.get("reservation_id", 1234),
        "application_id": kwargs.get("application_id", 1234),
        "application_section_id": kwargs.get("application_section_id", 5678),
        "instructions_confirmed": kwargs.get("instructions_confirmed", "[HYVÄKSYTYN VARAUKSEN OHJEET]"),
        "instructions_cancelled": kwargs.get("instructions_cancelled", "[PERUUTETUN VARAUKSEN OHJEET]"),
        "instructions_pending": kwargs.get("instructions_pending", "[KÄSITELTÄVÄN VARAUKSEN OHJEET]"),
        "weekday_value": kwargs.get("weekday_value", str(WeekdayChoice.MONDAY.label)),
        "time_value": kwargs.get("time_value", "13:00-15:00"),
        "application_section_name": kwargs.get("application_section_name", "[HAKEMUKSEN OSAN NIMI]"),
        "application_round_name": kwargs.get("application_round_name", "[KAUSIVARAUSKIERROKSEN NIMI]"),
        "cancelled_reservation_series": kwargs.get(
            "cancelled_reservation_series",
            [
                {
                    "weekday_value": str(WeekdayChoice.MONDAY.label),
                    "time_value": "13:00-15:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=1234),
                },
                {
                    "weekday_value": str(WeekdayChoice.TUESDAY.label),
                    "time_value": "21:00-22:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=5678),
                },
            ],
        ),
        "access_code_is_used": access_code_is_used,
        "access_code": kwargs.get("access_code", "123456") if access_code_is_used else "",
        "access_code_validity_period": (
            kwargs.get("access_code_validity_period", "11:00-15:00") if access_code_is_used else ""
        ),
    }


@get_translated
def get_mock_data(*, email_type: EmailType, language: Lang, **kwargs: Any) -> EmailContext | None:  # noqa: PLR0912, PLR0911
    mock_params = get_mock_params(language=language, **kwargs)

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
                email_recipient_name=mock_params["email_recipient_name"],
                application_section_name=mock_params["application_section_name"],
                application_round_name=mock_params["application_round_name"],
                cancel_reason=mock_params["cancel_reason"],
                application_id=mock_params["application_id"],
                application_section_id=mock_params["application_section_id"],
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
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                non_subsidised_price=mock_params["non_subsidised_price"],
                tax_percentage=mock_params["tax_percentage"],
                reservation_id=mock_params["reservation_id"],
                instructions_confirmed=mock_params["instructions_confirmed"],
                access_code_is_used=mock_params["access_code_is_used"],
                access_code=mock_params["access_code"],
                access_code_validity_period=mock_params["access_code_validity_period"],
                language=language,
            )
        case EmailType.RESERVATION_CANCELLED:
            return get_context_for_reservation_cancelled(
                email_recipient_name=mock_params["email_recipient_name"],
                cancel_reason=mock_params["cancel_reason"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                tax_percentage=mock_params["tax_percentage"],
                reservation_id=mock_params["reservation_id"],
                instructions_cancelled=mock_params["instructions_cancelled"],
                language=language,
            )
        case EmailType.RESERVATION_CONFIRMED:
            return get_context_for_reservation_confirmed(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                tax_percentage=mock_params["tax_percentage"],
                reservation_id=mock_params["reservation_id"],
                instructions_confirmed=mock_params["instructions_confirmed"],
                access_code_is_used=mock_params["access_code_is_used"],
                access_code=mock_params["access_code"],
                access_code_validity_period=mock_params["access_code_validity_period"],
                language=language,
            )
        case EmailType.RESERVATION_MODIFIED:
            return get_context_for_reservation_modified(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                tax_percentage=mock_params["tax_percentage"],
                reservation_id=mock_params["reservation_id"],
                instructions_confirmed=mock_params["instructions_confirmed"],
                access_code_is_used=mock_params["access_code_is_used"],
                access_code=mock_params["access_code"],
                access_code_validity_period=mock_params["access_code_validity_period"],
                language=language,
            )
        case EmailType.RESERVATION_MODIFIED_ACCESS_CODE:
            return get_context_for_reservation_modified_access_code(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                tax_percentage=mock_params["tax_percentage"],
                reservation_id=mock_params["reservation_id"],
                instructions_confirmed=mock_params["instructions_confirmed"],
                access_code_is_used=True,
                access_code=mock_params["access_code"],
                access_code_validity_period=mock_params["access_code_validity_period"],
                language=language,
            )
        case EmailType.RESERVATION_REJECTED:
            return get_context_for_reservation_rejected(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                rejection_reason=mock_params["rejection_reason"],
                reservation_id=mock_params["reservation_id"],
                instructions_cancelled=mock_params["instructions_cancelled"],
                language=language,
            )
        case EmailType.RESERVATION_REQUIRES_HANDLING:
            return get_context_for_reservation_requires_handling(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                subsidised_price=mock_params["subsidised_price"],
                applying_for_free_of_charge=mock_params["applying_for_free_of_charge"],
                tax_percentage=mock_params["tax_percentage"],
                reservation_id=mock_params["reservation_id"],
                instructions_pending=mock_params["instructions_pending"],
                language=language,
            )
        case EmailType.RESERVATION_REQUIRES_PAYMENT:
            return get_context_for_reservation_requires_payment(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                price=mock_params["price"],
                tax_percentage=mock_params["tax_percentage"],
                payment_due_date=mock_params["payment_due_date"],
                reservation_id=mock_params["reservation_id"],
                instructions_confirmed=mock_params["instructions_confirmed"],
                language=language,
            )

        case EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE:
            return get_context_for_seasonal_reservation_cancelled_single(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                cancel_reason=mock_params["cancel_reason"],
                application_id=mock_params["application_id"],
                application_section_id=mock_params["application_section_id"],
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES:
            return get_context_for_seasonal_reservation_modified_series(
                email_recipient_name=mock_params["email_recipient_name"],
                weekday_value=mock_params["weekday_value"],
                time_value=mock_params["time_value"],
                application_section_name=mock_params["application_section_name"],
                application_round_name=mock_params["application_round_name"],
                application_id=mock_params["application_id"],
                application_section_id=mock_params["application_section_id"],
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE:
            return get_context_for_seasonal_reservation_modified_single(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                application_id=mock_params["application_id"],
                application_section_id=mock_params["application_section_id"],
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_REJECTED_SERIES:
            return get_context_for_seasonal_reservation_rejected_series(
                email_recipient_name=mock_params["email_recipient_name"],
                weekday_value=mock_params["weekday_value"],
                time_value=mock_params["time_value"],
                application_section_name=mock_params["application_section_name"],
                application_round_name=mock_params["application_round_name"],
                rejection_reason=mock_params["rejection_reason"],
                application_id=mock_params["application_id"],
                application_section_id=mock_params["application_section_id"],
                language=language,
            )
        case EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE:
            return get_context_for_seasonal_reservation_rejected_single(
                email_recipient_name=mock_params["email_recipient_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                rejection_reason=mock_params["rejection_reason"],
                application_id=mock_params["application_id"],
                application_section_id=mock_params["application_section_id"],
                language=language,
            )

        # Staff ########################################################################################################

        case EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED:
            return get_context_for_staff_notification_application_section_cancelled(
                application_section_name=mock_params["application_section_name"],
                application_round_name=mock_params["application_round_name"],
                cancel_reason=mock_params["cancel_reason"],
                cancelled_reservation_series=mock_params["cancelled_reservation_series"],
                language=language,
            )
        case EmailType.STAFF_NOTIFICATION_RESERVATION_MADE:
            return get_context_for_staff_notification_reservation_made(
                reservee_name=mock_params["reservee_name"],
                reservation_name=mock_params["reservation_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                reservation_id=mock_params["reservation_id"],
                language=language,
            )
        case EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING:
            return get_context_for_staff_notification_reservation_requires_handling(
                reservee_name=mock_params["reservee_name"],
                reservation_name=mock_params["reservation_name"],
                reservation_unit_name=mock_params["reservation_unit_name"],
                unit_name=mock_params["unit_name"],
                unit_location=mock_params["unit_location"],
                begin_datetime=mock_params["begin_datetime"],
                end_datetime=mock_params["end_datetime"],
                reservation_id=mock_params["reservation_id"],
                language=language,
            )

        case _:
            return None
