from __future__ import annotations

from typing import TYPE_CHECKING, Any, overload

from django.utils.translation import pgettext

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.translation import get_attr_by_language, get_translated
from utils.date_utils import local_date
from utils.utils import convert_html_to_text

from .common import (
    create_anchor_tag,
    get_contex_for_reservation_basic_info,
    get_contex_for_reservation_manage_link,
    get_contex_for_reservation_price,
    get_contex_for_seasonal_reservation_check_details_url,
    get_context_for_translations,
    get_my_reservations_ext_link,
    get_staff_reservations_ext_link,
    params_for_application_section_info,
    params_for_base_info,
    params_for_price_info,
    params_for_price_range_info,
    params_for_reservation_series_info,
)

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.models import RecurringReservation, Reservation
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_context_for_reservation_approved",
    "get_context_for_reservation_cancelled",
    "get_context_for_reservation_confirmed",
    "get_context_for_reservation_modified",
    "get_context_for_reservation_rejected",
    "get_context_for_reservation_requires_handling",
    "get_context_for_reservation_requires_payment",
    "get_context_for_seasonal_reservation_cancelled_single",
    "get_context_for_seasonal_reservation_modified_series",
    "get_context_for_seasonal_reservation_modified_single",
    "get_context_for_seasonal_reservation_rejected_series",
    "get_context_for_seasonal_reservation_rejected_single",
    "get_context_for_staff_notification_reservation_made",
    "get_context_for_staff_notification_reservation_requires_handling",
]


# All contexts have two 'implementations': one for fetching data from
# a Reservation object, and one for setting them manually (e.g. from a form).
# See how '@overload' is used to make the two implementations work from one function.


# type: EmailType.RESERVATION_APPROVED #################################################################################


@overload
def get_context_for_reservation_approved(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_approved(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    price: Decimal,
    non_subsidised_price: Decimal,
    tax_percentage: Decimal,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_approved(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "non_subsidised_price": reservation.non_subsidised_price,
            "instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    text_reservation_approved = (
        pgettext("Email", "Your booking has been confirmed with the following discount:")
        if data["price"] < data["non_subsidised_price"]
        else pgettext("Email", "Your booking is now confirmed")
    )

    return {
        "title": pgettext("Email", "Your booking is confirmed"),
        "text_reservation_approved": text_reservation_approved,
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price(
            price=data["price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


# type: EmailType.RESERVATION_CANCELLED ################################################################################


@overload
def get_context_for_reservation_cancelled(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_cancelled(
    *,
    language: Lang,
    email_recipient_name: str,
    cancel_reason: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    price: Decimal,
    tax_percentage: Decimal,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_cancelled(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "cancel_reason": get_attr_by_language(reservation.cancel_reason, "reason", language=language),
            "instructions": reservation.actions.get_instructions(kind="cancelled", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Your booking has been cancelled"),
        "cancel_reason": data["cancel_reason"],
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price(
            price=data["price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
        ),
    }


# type: EmailType.RESERVATION_CONFIRMED ################################################################################


@overload
def get_context_for_reservation_confirmed(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_confirmed(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    price: Decimal,
    tax_percentage: Decimal,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_confirmed(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Thank you for your booking at Varaamo"),
        "text_reservation_confirmed": pgettext("Email", "You have made a new booking"),
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price(
            price=data["price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


# type: EmailType.RESERVATION_MODIFIED #################################################################################


@overload
def get_context_for_reservation_modified(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_modified(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    price: Decimal,
    tax_percentage: Decimal,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_modified(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Your booking has been updated"),
        "text_reservation_modified": pgettext("Email", "Your booking has been updated"),
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price(
            price=data["price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


# type: EmailType.RESERVATION_REJECTED #################################################################################


@overload
def get_context_for_reservation_rejected(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_rejected(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    rejection_reason: str,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_rejected(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "instructions": reservation.actions.get_instructions(kind="cancelled", language=language),
            "rejection_reason": get_attr_by_language(reservation.deny_reason, "reason", language),
            "reservation_id": reservation.id,
            **params_for_base_info(reservation=reservation, language=language),
        }

    return {
        "title": pgettext("Email", "Unfortunately your booking cannot be confirmed"),
        "text_reservation_rejected": pgettext("Email", "Unfortunately your booking cannot be confirmed"),
        "rejection_reason": data["rejection_reason"],
        "reservation_id": str(data["reservation_id"]),
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
    }


# type: EmailType.RESERVATION_REQUIRES_HANDLING ########################################################################


@overload
def get_context_for_reservation_requires_handling(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_requires_handling(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    price: Decimal,
    subsidised_price: Decimal,
    applying_for_free_of_charge: bool,
    tax_percentage: Decimal,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_requires_handling(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "instructions": reservation.actions.get_instructions(kind="pending", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_range_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Your booking is waiting for processing"),
        "text_reservation_requires_handling": pgettext("Email", "You have made a new booking request"),
        "text_pending_notification": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request.",
        ),
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price(
            price=data["price"],
            subsidised_price=data["subsidised_price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
            applying_for_free_of_charge=data["applying_for_free_of_charge"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


# type: EmailType.RESERVATION_REQUIRES_PAYMENT #########################################################################


@overload
def get_context_for_reservation_requires_payment(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_reservation_requires_payment(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    price: Decimal,
    tax_percentage: Decimal,
    payment_due_date: datetime.date,
    reservation_id: int,
    instructions: str,
) -> EmailContext: ...


@get_translated
def get_context_for_reservation_requires_payment(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "payment_due_date": local_date(),
            "instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    link = get_my_reservations_ext_link(language=language)
    text = pgettext("Email", "Pay the booking")
    title = pgettext("Email", "Your booking has been confirmed, and can be paid")
    return {
        "title": title,
        "text_reservation_requires_payment": title,
        "payment_due_date_label": pgettext("Email", "Due date"),
        "payment_due_date": data["payment_due_date"].strftime("%-d.%-m.%Y"),
        "pay_reservation_link_html": create_anchor_tag(link=link, text=text),
        "pay_reservation_link": f"{text}: {link}",
        "instructions_html": data["instructions"],
        "instructions_text": convert_html_to_text(data["instructions"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price(
            price=data["price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


# type: EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE ################################################################


@overload
def get_context_for_seasonal_reservation_cancelled_single(
    reservation: Reservation, *, language: Lang
) -> EmailContext: ...


@overload
def get_context_for_seasonal_reservation_cancelled_single(
    *,
    language: Lang,
    email_recipient_name: str,
    cancel_reason: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    application_id: int | None,
    application_section_id: int | None,
) -> EmailContext: ...


@get_translated
def get_context_for_seasonal_reservation_cancelled_single(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        application_section = reservation.actions.get_application_section()

        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "cancel_reason": get_attr_by_language(reservation.cancel_reason, "reason", language=language),
            "application_id": getattr(application_section, "application_id", None),
            "application_section_id": getattr(application_section, "id", None),
            **params_for_base_info(reservation=reservation, language=language),
        }

    return {
        "title": pgettext("Email", "The space reservation included in your seasonal booking has been cancelled"),
        "cancel_reason": data["cancel_reason"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES #################################################################


@overload
def get_context_for_seasonal_reservation_modified_series(
    reservation_series: RecurringReservation, *, language: Lang
) -> EmailContext: ...


@overload
def get_context_for_seasonal_reservation_modified_series(
    *,
    language: Lang,
    email_recipient_name: str,
    weekday_value: str,
    time_value: str,
    application_section_name: str,
    application_round_name: str,
    application_id: int | None,
    application_section_id: int | None,
) -> EmailContext: ...


@get_translated
def get_context_for_seasonal_reservation_modified_series(
    reservation_series: RecurringReservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation_series is not None:
        application_section = reservation_series.actions.get_application_section()

        data: dict[str, Any] = {
            "email_recipient_name": application_section.application.applicant,
            "application_id": getattr(application_section, "application_id", None),
            "application_section_id": getattr(application_section, "id", None),
            **params_for_reservation_series_info(reservation_series=reservation_series),
            **params_for_application_section_info(application_section=application_section, language=language),
        }

    title = pgettext("Email", "The time of the space reservation included in your seasonal booking has changed")
    return {
        "title": title,
        "text_reservation_modified": title,
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "weekday_value": data["weekday_value"],
        "time_value": data["time_value"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE #################################################################


@overload
def get_context_for_seasonal_reservation_modified_single(
    reservation: Reservation, *, language: Lang
) -> EmailContext: ...


@overload
def get_context_for_seasonal_reservation_modified_single(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    application_id: int | None,
    application_section_id: int | None,
) -> EmailContext: ...


@get_translated
def get_context_for_seasonal_reservation_modified_single(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        application_section = reservation.actions.get_application_section()

        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "application_id": getattr(application_section, "application_id", None),
            "application_section_id": getattr(application_section, "id", None),
            **params_for_base_info(reservation=reservation, language=language),
        }

    title = pgettext("Email", "The time of the space reservation included in your seasonal booking has changed")
    return {
        "title": title,
        "text_reservation_modified": title,
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


# type: EmailType.SEASONAL_RESERVATION_REJECTED_SERIES #################################################################


@overload
def get_context_for_seasonal_reservation_rejected_series(
    reservation_series: RecurringReservation, *, language: Lang
) -> EmailContext: ...


@overload
def get_context_for_seasonal_reservation_rejected_series(
    *,
    language: Lang,
    rejection_reason: str,
    email_recipient_name: str,
    weekday_value: str,
    time_value: str,
    application_section_name: str,
    application_round_name: str,
    application_id: int | None,
    application_section_id: int | None,
) -> EmailContext: ...


@get_translated
def get_context_for_seasonal_reservation_rejected_series(
    reservation_series: RecurringReservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation_series is not None:
        application_section = reservation_series.actions.get_application_section()
        latest_denied_reservation = reservation_series.reservations.filter(state=ReservationStateChoice.DENIED).last()

        data: dict[str, Any] = {
            "email_recipient_name": application_section.application.applicant,
            "rejection_reason": get_attr_by_language(latest_denied_reservation.deny_reason, "reason", language),
            "application_id": getattr(application_section, "application_id", None),
            "application_section_id": getattr(application_section, "id", None),
            **params_for_reservation_series_info(reservation_series=reservation_series),
            **params_for_application_section_info(application_section=application_section, language=language),
        }

    return {
        "title": pgettext("Email", "Your seasonal booking has been cancelled"),
        "text_reservation_rejected": pgettext(
            "Email", "The space reservation included in your seasonal booking has been cancelled"
        ),
        "rejection_reason": data["rejection_reason"],
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "weekday_value": data["weekday_value"],
        "time_value": data["time_value"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


# type: EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE #################################################################


@overload
def get_context_for_seasonal_reservation_rejected_single(
    reservation: Reservation, *, language: Lang
) -> EmailContext: ...


@overload
def get_context_for_seasonal_reservation_rejected_single(
    *,
    language: Lang,
    email_recipient_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    rejection_reason: str,
    application_id: int | None,
    application_section_id: int | None,
) -> EmailContext: ...


@get_translated
def get_context_for_seasonal_reservation_rejected_single(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        application_section = reservation.actions.get_application_section()

        data: dict[str, Any] = {
            "email_recipient_name": reservation.actions.get_email_reservee_name(),
            "rejection_reason": get_attr_by_language(reservation.deny_reason, "reason", language),
            "application_id": getattr(application_section, "application_id", None),
            "application_section_id": getattr(application_section, "id", None),
            **params_for_base_info(reservation=reservation, language=language),
        }

    title = pgettext("Email", "The space reservation included in your seasonal booking has been cancelled")
    return {
        "title": title,
        "text_reservation_rejected": title,
        "rejection_reason": data["rejection_reason"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


# type: EmailType.STAFF_NOTIFICATION_RESERVATION_MADE ##################################################################


@overload
def get_context_for_staff_notification_reservation_made(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_staff_notification_reservation_made(
    *,
    language: Lang,
    reservee_name: str,
    reservation_name: str,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
    reservation_id: int,
) -> EmailContext: ...


@get_translated
def get_context_for_staff_notification_reservation_made(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "reservee_name": reservation.actions.get_email_reservee_name(),
            "reservation_name": reservation.name,
            "reservation_id": reservation.id,
            **params_for_base_info(reservation=reservation, language=language),
        }

    link = get_staff_reservations_ext_link(reservation_id=data["reservation_id"])

    return {
        "title": (
            pgettext("Email", "New booking %(reservation_id)s has been made for %(unit_name)s")
            % {
                "reservation_id": data["reservation_id"],
                "unit_name": data["unit_name"],
            }
        ),
        "text_staff_reservation_made": (
            pgettext("Email", "A new booking has been confirmed for %(reservation_unit_name)s")
            % {
                "reservation_unit_name": data["reservation_unit_name"],
            }
        ),
        "reservation_name": data["reservation_name"],
        "reservee_name": data["reservee_name"],
        "reservation_id": str(data["reservation_id"]),
        "staff_reservations_ext_link_html": create_anchor_tag(link=link),
        "staff_reservations_ext_link": link,
        **get_context_for_translations(language=language, email_recipient_name=None),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
    }


# type: EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING #####################################################


@overload
def get_context_for_staff_notification_reservation_requires_handling(
    reservation: Reservation,
    *,
    language: Lang,
) -> EmailContext: ...


@overload
def get_context_for_staff_notification_reservation_requires_handling(
    *,
    language: Lang,
    reservee_name: str | None = None,
    reservation_name: str | None = None,
    reservation_unit_name: str | None = None,
    unit_name: str | None = None,
    unit_location: str | None = None,
    begin_datetime: datetime.datetime | None = None,
    end_datetime: datetime.datetime | None = None,
    reservation_id: int | None = None,
) -> EmailContext: ...


@get_translated
def get_context_for_staff_notification_reservation_requires_handling(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if reservation is not None:
        data: dict[str, Any] = {
            "reservee_name": reservation.actions.get_email_reservee_name(),
            "reservation_name": reservation.name,
            "reservation_id": reservation.id,
            **params_for_base_info(reservation=reservation, language=language),
        }

    link = get_staff_reservations_ext_link(reservation_id=data["reservation_id"])

    return {
        "title": (
            pgettext("Email", "New booking %(reservation_id)s requires handling at unit %(unit_name)s")
            % {
                "reservation_id": data["reservation_id"],
                "unit_name": data["unit_name"],
            }
        ),
        "text_staff_reservation_requires_handling": (
            pgettext("Email", "A booking request for %(reservation_unit_name)s is waiting for processing")
            % {
                "reservation_unit_name": data["reservation_unit_name"],
            }
        ),
        "reservation_name": data["reservation_name"],
        "reservee_name": data["reservee_name"],
        "reservation_id": str(data["reservation_id"]),
        "staff_reservations_ext_link_html": create_anchor_tag(link=link),
        "staff_reservations_ext_link": link,
        **get_context_for_translations(language=language, email_recipient_name=None),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
    }
