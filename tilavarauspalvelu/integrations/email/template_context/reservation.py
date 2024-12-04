from __future__ import annotations

from typing import TYPE_CHECKING, Any, overload

from django.utils.translation import pgettext

from tilavarauspalvelu.translation import get_attr_by_language, get_translated
from utils.date_utils import local_date

from .common import (
    create_anchor_tag,
    get_contex_for_base_template,
    get_contex_for_closing,
    get_contex_for_closing_polite,
    get_contex_for_closing_staff,
    get_contex_for_reservation_basic_info,
    get_contex_for_reservation_manage_link,
    get_contex_for_reservation_price,
    get_contex_for_reservation_price_range,
    get_my_reservations_ext_link,
    get_staff_reservations_ext_link,
    params_for_base_info,
    params_for_price_info,
    params_for_price_range_info,
)

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_context_for_reservation_approved",
    "get_context_for_reservation_cancelled",
    "get_context_for_reservation_confirmed",
    "get_context_for_reservation_modified",
    "get_context_for_reservation_rejected",
    "get_context_for_reservation_requires_handling",
    "get_context_for_reservation_requires_payment",
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
    confirmed_instructions: str,
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
            "confirmed_instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
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
        "instructions_label": pgettext("Email", "Additional information about your booking"),
        "instructions": data["confirmed_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
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
        **get_contex_for_closing_polite(language=language),
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
    cancelled_instructions: str,
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
            "cancelled_instructions": reservation.actions.get_instructions(kind="cancelled", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Your booking has been cancelled"),
        "text_reservation_cancelled": pgettext("Email", "Your booking has been cancelled"),
        "cancel_reason_label": pgettext("Email", "Your reason for cancellation"),
        "cancel_reason": data["cancel_reason"],
        "instructions_label": pgettext("Email", "Additional information about cancellation"),
        "instructions": data["cancelled_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
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
        **get_contex_for_closing(language=language),
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
    confirmed_instructions: str,
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
            "confirmed_instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Thank you for your booking at Varaamo"),
        "text_reservation_confirmed": pgettext("Email", "You have made a new booking"),
        "instructions_label": pgettext("Email", "Additional information about your booking"),
        "instructions": data["confirmed_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
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
        **get_contex_for_closing_polite(language=language),
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
    confirmed_instructions: str,
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
            "confirmed_instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    return {
        "title": pgettext("Email", "Your booking has been updated"),
        "text_reservation_modified": pgettext("Email", "Your booking has been updated"),
        "instructions_label": pgettext("Email", "Additional information about your booking"),
        "instructions": data["confirmed_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
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
        **get_contex_for_closing_polite(language=language),
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
    cancelled_instructions: str,
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
            "cancelled_instructions": reservation.actions.get_instructions(kind="cancelled", language=language),
            "rejection_reason": get_attr_by_language(reservation.deny_reason, "reason", language),
            "reservation_id": reservation.id,
            **params_for_base_info(reservation=reservation, language=language),
        }

    return {
        "title": pgettext("Email", "Unfortunately your booking cannot be confirmed"),
        "text_reservation_rejected": pgettext("Email", "Unfortunately your booking cannot be confirmed"),
        "rejection_reason_label": pgettext("Email", "Reason"),
        "rejection_reason": data["rejection_reason"],
        "booking_number_label": pgettext("Email", "Booking number"),
        "reservation_id": str(data["reservation_id"]),
        "instructions_label": pgettext("Email", "Additional information"),
        "instructions": data["cancelled_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_closing(language=language),
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
    pending_instructions: str,
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
            "pending_instructions": reservation.actions.get_instructions(kind="pending", language=language),
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
        "instructions_label": pgettext("Email", "Additional information about your booking"),
        "instructions": data["pending_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_reservation_price_range(
            price=data["price"],
            subsidised_price=data["subsidised_price"],
            tax_percentage=data["tax_percentage"],
            reservation_id=data["reservation_id"],
            applying_for_free_of_charge=data["applying_for_free_of_charge"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
        **get_contex_for_closing_polite(language=language),
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
    confirmed_instructions: str,
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
            "confirmed_instructions": reservation.actions.get_instructions(kind="confirmed", language=language),
            **params_for_base_info(reservation=reservation, language=language),
            **params_for_price_info(reservation=reservation),
        }

    link = get_my_reservations_ext_link(language=language)
    text = pgettext("Email", "Pay the booking")

    return {
        "title": pgettext("Email", "Your booking has been confirmed, and can be paid"),
        "text_reservation_requires_payment": pgettext("Email", "Your booking has been confirmed, and can be paid"),
        "payment_due_date_label": pgettext("Email", "Due date"),
        "payment_due_date": data["payment_due_date"].strftime("%-d.%-m.%Y"),
        "pay_reservation_link_html": create_anchor_tag(link=link, text=text),
        "pay_reservation_link": f"{text}: {link}",
        "instructions_label": pgettext("Email", "Additional information about your booking"),
        "instructions": data["confirmed_instructions"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
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
        **get_contex_for_closing_polite(language=language),
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
        "reservee_name_label": pgettext("Email", "Reservee name"),
        "reservee_name": data["reservee_name"],
        "booking_number_label": pgettext("Email", "Booking number"),
        "reservation_id": str(data["reservation_id"]),
        "text_check_details": pgettext("Email", "You can view the booking at"),
        "staff_reservations_ext_link_html": create_anchor_tag(link=link),
        "staff_reservations_ext_link": link,
        **get_contex_for_base_template(),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_closing_staff(),
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
        "reservee_name_label": pgettext("Email", "Reservee name"),
        "reservee_name": data["reservee_name"],
        "booking_number_label": pgettext("Email", "Booking number"),
        "reservation_id": str(data["reservation_id"]),
        "text_check_details": pgettext("Email", "You can view and handle the booking at"),
        "staff_reservations_ext_link_html": create_anchor_tag(link=link),
        "staff_reservations_ext_link": link,
        **get_contex_for_base_template(),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
        **get_contex_for_closing_staff(),
    }
