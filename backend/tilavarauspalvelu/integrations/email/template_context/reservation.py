from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Unpack

from django.utils.translation import pgettext

from tilavarauspalvelu.translation import get_attr_by_language, get_translated
from utils.date_utils import local_datetime_string
from utils.utils import convert_html_to_text

from .common import (
    create_anchor_tag,
    get_contex_for_reservation_basic_info,
    get_contex_for_reservation_manage_link,
    get_contex_for_reservation_price,
    get_context_for_keyless_entry,
    get_context_for_translations,
    get_my_reservations_ext_link,
    get_reservation_ext_link,
    get_staff_reservations_ext_link,
    params_for_access_code_reservation,
    params_for_base_info,
    params_for_price_info,
    params_for_price_range_info,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.email.typing import (
        EmailType,
        ReservationAccessCodeAddedContext,
        ReservationAccessCodeChangedContext,
        ReservationApprovedContext,
        ReservationCancelledContext,
        ReservationConfirmedContext,
        ReservationConfirmedStaffNotificationContext,
        ReservationDeniedContext,
        ReservationRequiresHandlingContext,
        ReservationRequiresHandlingStaffNotificationContext,
        ReservationRequiresPaymentContext,
        ReservationRescheduledContext,
    )
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import EmailContext, Lang


__all__ = [
    "get_context_for_reservation_access_code_added",
    "get_context_for_reservation_access_code_changed",
    "get_context_for_reservation_approved",
    "get_context_for_reservation_cancelled",
    "get_context_for_reservation_confirmed",
    "get_context_for_reservation_confirmed_staff_notification",
    "get_context_for_reservation_denied",
    "get_context_for_reservation_requires_handling",
    "get_context_for_reservation_requires_handling_staff_notification",
    "get_context_for_reservation_requires_payment",
    "get_context_for_reservation_rescheduled",
]


@get_translated
def get_context_for_reservation_access_code_added(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationAccessCodeAddedContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_ACCESS_CODE_ADDED]:
    if reservation is not None:
        context = get_context_for_reservation_access_code_changed(reservation=reservation, language=language)
    else:
        context = get_context_for_reservation_access_code_changed(**data, language=language)

    title = pgettext("Email", "Access to the space has changed")

    text = pgettext("Email", "My bookings")
    text = f"{text!r}"
    link = get_my_reservations_ext_link(language=language)

    body = pgettext("Email", "You can find the door code in this message and at %(my_reservations)s page at Varaamo")
    body_html = body % {"my_reservations": create_anchor_tag(link=link, text=text)}
    body_text = body % {"my_reservations": f"{text} ({link})"}

    context["title"] = title
    context["text_reservation_modified_html"] = f"{title}. {body_html}."
    context["text_reservation_modified"] = f"{title}. {body_text}."

    return context


@get_translated
def get_context_for_reservation_access_code_changed(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationAccessCodeChangedContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_ACCESS_CODE_CHANGED]:
    if reservation is not None:
        context = get_context_for_reservation_rescheduled(reservation=reservation, language=language)
    else:
        context = get_context_for_reservation_rescheduled(**data, language=language)

    title = pgettext("Email", "The door code of your booking has changed")

    context["title"] = title
    context["text_reservation_modified_html"] = title
    context["text_reservation_modified"] = title

    return context


@get_translated
def get_context_for_reservation_approved(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationApprovedContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_APPROVED]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["non_subsidised_price"] = reservation.non_subsidised_price
        data["instructions_confirmed"] = reservation.actions.get_instructions(kind="confirmed", language=language)

        data |= params_for_base_info(reservation=reservation, language=language)
        data |= params_for_price_info(reservation=reservation)
        data |= params_for_access_code_reservation(reservation=reservation)

    text_reservation_approved = (
        pgettext("Email", "Your booking has been confirmed with the following discount:")
        if data["price"] < data["non_subsidised_price"]
        else pgettext("Email", "Your booking is now confirmed")
    )

    return {
        "title": pgettext("Email", "Your booking is confirmed"),
        "text_reservation_approved": text_reservation_approved,
        "instructions_confirmed_html": data["instructions_confirmed"],
        "instructions_confirmed_text": convert_html_to_text(data["instructions_confirmed"]),
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
        **get_context_for_keyless_entry(
            language=language,
            access_code_is_used=data["access_code_is_used"],
            access_code=data["access_code"],
            access_code_validity_period=data["access_code_validity_period"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


@get_translated
def get_context_for_reservation_cancelled(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationCancelledContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_CANCELLED]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["cancel_reason"] = get_attr_by_language(reservation.cancel_reason, "reason", language=language)
        data["instructions_cancelled"] = reservation.actions.get_instructions(kind="cancelled", language=language)

        data |= params_for_base_info(reservation=reservation, language=language)
        data |= params_for_price_info(reservation=reservation)

    return {
        "title": pgettext("Email", "Your booking has been cancelled"),
        "cancel_reason": data["cancel_reason"],
        "instructions_cancelled_html": data["instructions_cancelled"],
        "instructions_cancelled_text": convert_html_to_text(data["instructions_cancelled"]),
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


@get_translated
def get_context_for_reservation_confirmed(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationConfirmedContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_CONFIRMED]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["instructions_confirmed"] = reservation.actions.get_instructions(kind="confirmed", language=language)

        data |= params_for_base_info(reservation=reservation, language=language)
        data |= params_for_price_info(reservation=reservation)
        data |= params_for_access_code_reservation(reservation=reservation)

    return {
        "title": pgettext("Email", "Thank you for your booking at Varaamo"),
        "text_reservation_confirmed": pgettext("Email", "You have made a new booking"),
        "instructions_confirmed_html": data["instructions_confirmed"],
        "instructions_confirmed_text": convert_html_to_text(data["instructions_confirmed"]),
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
        **get_context_for_keyless_entry(
            language=language,
            access_code_is_used=data["access_code_is_used"],
            access_code=data["access_code"],
            access_code_validity_period=data["access_code_validity_period"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }


@get_translated
def get_context_for_reservation_confirmed_staff_notification(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationConfirmedStaffNotificationContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_CONFIRMED_STAFF_NOTIFICATION]:
    if reservation is not None:
        data["reservee_name"] = reservation.actions.get_email_reservee_name()
        data["reservation_name"] = reservation.name
        data["reservation_id"] = reservation.id

        data |= params_for_base_info(reservation=reservation, language=language)

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


@get_translated
def get_context_for_reservation_denied(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationDeniedContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_DENIED]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["instructions_cancelled"] = reservation.actions.get_instructions(kind="cancelled", language=language)
        data["rejection_reason"] = get_attr_by_language(reservation.deny_reason, "reason", language)
        data["reservation_id"] = reservation.id

        data |= params_for_base_info(reservation=reservation, language=language)

    return {
        "title": pgettext("Email", "Unfortunately your booking cannot be confirmed"),
        "text_reservation_rejected": pgettext("Email", "Unfortunately your booking cannot be confirmed"),
        "rejection_reason": data["rejection_reason"],
        "reservation_id": str(data["reservation_id"]),
        "instructions_cancelled_html": data["instructions_cancelled"],
        "instructions_cancelled_text": convert_html_to_text(data["instructions_cancelled"]),
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_reservation_basic_info(
            reservation_unit_name=data["reservation_unit_name"],
            unit_name=data["unit_name"],
            unit_location=data["unit_location"],
            begin_datetime=data["begin_datetime"],
            end_datetime=data["end_datetime"],
        ),
    }


@get_translated
def get_context_for_reservation_requires_handling(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationRequiresHandlingContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_REQUIRES_HANDLING]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["instructions_pending"] = reservation.actions.get_instructions(kind="pending", language=language)

        data |= params_for_base_info(reservation=reservation, language=language)
        data |= params_for_price_range_info(reservation=reservation)

    return {
        "title": pgettext("Email", "Your booking is waiting for processing"),
        "text_reservation_requires_handling": pgettext("Email", "You have made a new booking request"),
        "text_pending_notification": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request.",
        ),
        "instructions_pending_html": data["instructions_pending"],
        "instructions_pending_text": convert_html_to_text(data["instructions_pending"]),
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


@get_translated
def get_context_for_reservation_requires_handling_staff_notification(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationRequiresHandlingStaffNotificationContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_REQUIRES_HANDLING_STAFF_NOTIFICATION]:
    if reservation is not None:
        data["reservee_name"] = reservation.actions.get_email_reservee_name()
        data["reservation_name"] = reservation.name
        data["reservation_id"] = reservation.id

        data |= params_for_base_info(reservation=reservation, language=language)

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


@get_translated
def get_context_for_reservation_requires_payment(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationRequiresPaymentContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_REQUIRES_PAYMENT]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["instructions_confirmed"] = reservation.actions.get_instructions(kind="confirmed", language=language)
        data["handled_payment_due_by"] = reservation.payment_order.handled_payment_due_by

        data |= params_for_base_info(reservation=reservation, language=language)
        data |= params_for_price_info(reservation=reservation)

    title = pgettext("Email", "Your booking is confirmed, please pay online")
    text_reservation_requires_payment = pgettext(
        "Email",
        "Your booking is now confirmed. "
        "Please pay online or choose invoice as the payment method by the deadline, "
        "otherwise, the booking will be automatically canceled.",
    )
    handled_payment_text = pgettext("Email", "Pay the booking at Varaamo")
    handled_payment_link = get_reservation_ext_link(reservation_number=data["reservation_id"], language=language)

    return {
        "title": title,
        "text_reservation_requires_payment": text_reservation_requires_payment,
        "handled_payment_due_by_label": pgettext("Email", "Deadline"),
        "handled_payment_due_by": local_datetime_string(data["handled_payment_due_by"]),
        "handled_payment_text": handled_payment_text,
        "handled_payment_link": handled_payment_link,
        "handled_payment_link_html": create_anchor_tag(link=handled_payment_link, text=handled_payment_text),
        "instructions_confirmed_html": data["instructions_confirmed"],
        "instructions_confirmed_text": convert_html_to_text(data["instructions_confirmed"]),
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


@get_translated
def get_context_for_reservation_rescheduled(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[ReservationRescheduledContext],
) -> Annotated[EmailContext, EmailType.RESERVATION_RESCHEDULED]:
    if reservation is not None:
        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["instructions_confirmed"] = reservation.actions.get_instructions(kind="confirmed", language=language)

        data |= params_for_base_info(reservation=reservation, language=language)
        data |= params_for_price_info(reservation=reservation)
        data |= params_for_access_code_reservation(reservation=reservation)

    return {
        "title": pgettext("Email", "Your booking has been updated"),
        "text_reservation_modified": pgettext("Email", "Your booking has been updated"),
        "instructions_confirmed_html": data["instructions_confirmed"],
        "instructions_confirmed_text": convert_html_to_text(data["instructions_confirmed"]),
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
        **get_context_for_keyless_entry(
            language=language,
            access_code_is_used=data["access_code_is_used"],
            access_code=data["access_code"],
            access_code_validity_period=data["access_code_validity_period"],
        ),
        **get_contex_for_reservation_manage_link(language=language),
    }
