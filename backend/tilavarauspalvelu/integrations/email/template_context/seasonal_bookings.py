from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Unpack

from django.utils.translation import pgettext

from tilavarauspalvelu.enums import ReservationCancelReasonChoice, ReservationStateChoice
from tilavarauspalvelu.translation import get_attr_by_language, get_translated
from utils.date_utils import local_time_string

from .common import (
    create_anchor_tag,
    get_contex_for_reservation_basic_info,
    get_contex_for_seasonal_reservation_check_details_url,
    get_context_for_keyless_entry,
    get_context_for_translations,
    get_my_applications_ext_link,
    get_section_allocation,
    params_for_access_code_section,
    params_for_access_code_series,
    params_for_base_info,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.email.typing import (
        EmailType,
        SeasonalBookingAccessCodeAddedContext,
        SeasonalBookingAccessCodeChangedContext,
        SeasonalBookingCancelledAllContext,
        SeasonalBookingCancelledAllStaffNotificationContext,
        SeasonalBookingCancelledSingleContext,
        SeasonalBookingDeniedSeriesContext,
        SeasonalBookingDeniedSingleContext,
        SeasonalBookingRescheduledSeriesContext,
        SeasonalBookingRescheduledSingleContext,
    )
    from tilavarauspalvelu.models import ApplicationSection, Reservation, ReservationSeries
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_context_for_seasonal_booking_access_code_added",
    "get_context_for_seasonal_booking_access_code_changed",
    "get_context_for_seasonal_booking_application_received",
    "get_context_for_seasonal_booking_application_round_handled",
    "get_context_for_seasonal_booking_application_round_in_allocation",
    "get_context_for_seasonal_booking_cancelled_all",
    "get_context_for_seasonal_booking_cancelled_all_staff_notification",
    "get_context_for_seasonal_booking_cancelled_single",
    "get_context_for_seasonal_booking_denied_series",
    "get_context_for_seasonal_booking_denied_single",
    "get_context_for_seasonal_booking_rescheduled_series",
    "get_context_for_seasonal_booking_rescheduled_single",
]


@get_translated
def get_context_for_seasonal_booking_access_code_added(
    section: ApplicationSection | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingAccessCodeAddedContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED]:
    if section is not None:
        context = get_context_for_seasonal_booking_access_code_changed(section, language=language)
    else:
        context = get_context_for_seasonal_booking_access_code_changed(**data, language=language)

    title = pgettext("Email", "Access to the space has changed")

    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "My applications")
    text = f"{text!r}"

    body = pgettext("Email", "You can find the door code in this message and at %(my_applications)s page at Varaamo")
    body_html = body % {"my_applications": create_anchor_tag(link=link, text=text)}
    body_text = body % {"my_applications": f"{text} ({link})"}

    context["title"] = title
    context["text_reservation_modified_html"] = f"{title}. {body_html}."
    context["text_reservation_modified"] = f"{title}. {body_text}."

    return context


@get_translated
def get_context_for_seasonal_booking_access_code_changed(
    section: ApplicationSection | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingAccessCodeChangedContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED]:
    if section is not None:
        application_round = section.application.application_round

        data["email_recipient_name"] = section.application.applicant
        data["application_id"] = section.application.pk
        data["application_section_id"] = section.pk
        data["application_section_name"] = section.name
        data["application_round_name"] = get_attr_by_language(application_round, "name", language)

        data |= params_for_access_code_section(section=section)

    title = pgettext("Email", "The door code of your booking has changed")
    return {
        "title": title,
        "text_reservation_modified_html": title,
        "text_reservation_modified": title,
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "allocations": data["allocations"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
        **get_context_for_keyless_entry(
            language=language,
            access_code_is_used=data["access_code_is_used"],
            access_code=data["access_code"],
            access_code_validity_period="",  # Allocations have different validity periods
        ),
    }


@get_translated
def get_context_for_seasonal_booking_application_received(
    *,
    language: Lang,
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED]:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "My applications")

    body = pgettext(
        "Email",
        "You can edit your application on the %(my_applications)s page until the application deadline",
    )
    body_html = body % {"my_applications": create_anchor_tag(link=link, text=f"{text!r}")}
    body_text = body % {"my_applications": f"{text!r}"} + f": {link}"

    return {
        "title": pgettext("Email", "Your application has been received"),
        "text_application_received": pgettext("Email", "Thank you for your application"),
        "text_view_application_html": body_html,
        "text_view_application": body_text,
        **get_context_for_translations(language=language, email_recipient_name=None),
    }


@get_translated
def get_context_for_seasonal_booking_application_round_handled(
    *,
    language: Lang,
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_HANDLED]:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "My applications")

    body = pgettext("Email", "You can view the result of the processing on the %(my_applications)s page")
    body_html = body % {"my_applications": create_anchor_tag(link=link, text=f"{text!r}")}
    body_text = body % {"my_applications": f"{text!r}"} + f": {link}"

    return {
        "title": pgettext("Email", "Your application has been processed"),
        "text_application_handled": pgettext("Email", "Your application has been processed"),
        "text_view_application_html": body_html,
        "text_view_application": body_text,
        **get_context_for_translations(language=language, email_recipient_name=None),
    }


@get_translated
def get_context_for_seasonal_booking_application_round_in_allocation(
    *,
    language: Lang,
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION]:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "My applications")

    body = pgettext("Email", "You can view the application you have sent on the %(my_applications)s page")
    body_html = body % {"my_applications": create_anchor_tag(link=link, text=f"{text!r}")}
    body_text = body % {"my_applications": f"{text!r}"} + f": {link}"

    return {
        "title": pgettext("Email", "Your application is being processed"),
        "text_application_in_allocation": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "The application deadline has passed. "
            "We will notify you of the result when your application has been processed.",
        ),
        "text_view_application_html": body_html,
        "text_view_application": body_text,
        **get_context_for_translations(language=language, email_recipient_name=None),
    }


@get_translated
def get_context_for_seasonal_booking_cancelled_all(
    section: ApplicationSection | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingCancelledAllContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_CANCELLED_ALL]:
    if section is not None:
        reservation: Reservation = section.actions.get_last_reservation()
        application_round = section.application.application_round

        cancel_reason = ReservationCancelReasonChoice(reservation.cancel_reason)

        data["email_recipient_name"] = section.application.applicant
        data["cancel_reason"] = str(cancel_reason.label)
        data["application_id"] = section.application.pk
        data["application_section_id"] = section.pk
        data["application_section_name"] = section.name
        data["application_round_name"] = get_attr_by_language(application_round, "name", language=language)

    return {
        "title": pgettext("Email", "Your seasonal booking has been cancelled"),
        "cancel_reason": data["cancel_reason"],
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


@get_translated
def get_context_for_seasonal_booking_cancelled_all_staff_notification(
    section: ApplicationSection | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingCancelledAllStaffNotificationContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION]:
    if section is not None:
        reservation: Reservation = section.actions.get_last_reservation()
        application_round = section.application.application_round

        cancel_reason = ReservationCancelReasonChoice(reservation.cancel_reason)

        data["cancel_reason"] = str(cancel_reason.label)
        data["application_section_name"] = section.name
        data["application_round_name"] = get_attr_by_language(application_round, "name", language=language)
        data["allocations"] = get_section_allocation(section=section)

    return {
        "title": pgettext("Email", "The customer has canceled the seasonal booking"),
        "cancel_reason": data["cancel_reason"],
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "allocations": data["allocations"],
        **get_context_for_translations(language=language, email_recipient_name=None),
    }


@get_translated
def get_context_for_seasonal_booking_cancelled_single(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingCancelledSingleContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_CANCELLED_SINGLE]:
    if reservation is not None:
        section = reservation.actions.get_application_section()

        cancel_reason = ReservationCancelReasonChoice(reservation.cancel_reason)

        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["cancel_reason"] = str(cancel_reason.label)
        data["application_id"] = getattr(section, "application_id", None)
        data["application_section_id"] = getattr(section, "id", None)

        data |= params_for_base_info(reservation=reservation, language=language)

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


@get_translated
def get_context_for_seasonal_booking_denied_series(
    series: ReservationSeries | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingDeniedSeriesContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_DENIED_SERIES]:
    if series is not None:
        # Should only be called for series that have been created from seasonal booking
        section = series.allocated_time_slot.reservation_unit_option.application_section  # type: ignore[union-attr]
        application_round = section.application.application_round
        reservation_unit = series.reservation_unit
        unit = reservation_unit.unit

        latest_denied_reservation = series.reservations.filter(state=ReservationStateChoice.DENIED).last()

        begin_time = local_time_string(series.begin_time)
        end_time = local_time_string(series.end_time)

        data["email_recipient_name"] = section.application.applicant
        data["rejection_reason"] = get_attr_by_language(latest_denied_reservation.deny_reason, "reason", language)
        data["application_id"] = section.application.pk
        data["application_section_id"] = section.pk
        data["application_section_name"] = section.name
        data["application_round_name"] = get_attr_by_language(application_round, "name", language=language)
        data["weekday_value"] = ", ".join(str(weekday.label) for weekday in series.actions.get_weekdays())
        data["time_value"] = f"{begin_time}-{end_time}"
        data["reservation_unit_name"] = get_attr_by_language(reservation_unit, "name", language)
        data["unit_name"] = get_attr_by_language(unit, "name", language)
        data["unit_location"] = series.reservation_unit.actions.get_address()

    return {
        "title": pgettext("Email", "Your seasonal booking has been cancelled"),
        "text_reservation_rejected": pgettext(
            "Email",
            "The space reservation included in your seasonal booking has been cancelled",
        ),
        "rejection_reason": data["rejection_reason"],
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "reservation_unit_name": data["reservation_unit_name"],
        "unit_name": data["unit_name"],
        "unit_location": data["unit_location"],
        "weekday_value": data["weekday_value"],
        "time_value": data["time_value"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
    }


@get_translated
def get_context_for_seasonal_booking_denied_single(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingDeniedSingleContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_DENIED_SINGLE]:
    if reservation is not None:
        section = reservation.actions.get_application_section()

        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["rejection_reason"] = get_attr_by_language(reservation.deny_reason, "reason", language)
        data["application_id"] = getattr(section, "application_id", None)
        data["application_section_id"] = getattr(section, "id", None)

        data |= params_for_base_info(reservation=reservation, language=language)

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


@get_translated
def get_context_for_seasonal_booking_rescheduled_series(
    series: ReservationSeries | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingRescheduledSeriesContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES]:
    if series is not None:
        # Should only be called for series that have been created from seasonal booking
        section = series.allocated_time_slot.reservation_unit_option.application_section  # type: ignore[union-attr]
        application_round = section.application.application_round
        reservation_unit = series.reservation_unit
        unit = reservation_unit.unit

        begin_time = local_time_string(series.begin_time)
        end_time = local_time_string(series.end_time)

        data["email_recipient_name"] = section.application.applicant
        data["application_id"] = section.application.pk
        data["application_section_id"] = section.pk
        data["application_section_name"] = section.name
        data["application_round_name"] = get_attr_by_language(application_round, "name", language)
        data["weekday_value"] = ", ".join(str(weekday.label) for weekday in series.actions.get_weekdays())
        data["time_value"] = f"{begin_time}-{end_time}"
        data["reservation_unit_name"] = get_attr_by_language(reservation_unit, "name", language)
        data["unit_name"] = get_attr_by_language(unit, "name", language)
        data["unit_location"] = series.reservation_unit.actions.get_address()

        data |= params_for_access_code_series(series=series)

    title = pgettext("Email", "The time of the space reservation included in your seasonal booking has changed")
    return {
        "title": title,
        "text_reservation_modified": title,
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "reservation_unit_name": data["reservation_unit_name"],
        "unit_name": data["unit_name"],
        "unit_location": data["unit_location"],
        "weekday_value": data["weekday_value"],
        "time_value": data["time_value"],
        **get_context_for_translations(language=language, email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(
            language=language,
            application_id=data["application_id"],
            application_section_id=data["application_section_id"],
        ),
        **get_context_for_keyless_entry(
            language=language,
            access_code_is_used=data["access_code_is_used"],
            access_code=data["access_code"],
            access_code_validity_period=data["access_code_validity_period"],
        ),
    }


@get_translated
def get_context_for_seasonal_booking_rescheduled_single(
    reservation: Reservation | None = None,
    *,
    language: Lang,
    **data: Unpack[SeasonalBookingRescheduledSingleContext],
) -> Annotated[EmailContext, EmailType.SEASONAL_BOOKING_RESCHEDULED_SINGLE]:
    if reservation is not None:
        section = reservation.actions.get_application_section()

        data["email_recipient_name"] = reservation.actions.get_email_reservee_name()
        data["application_id"] = getattr(section, "application_id", None)
        data["application_section_id"] = getattr(section, "id", None)

        data |= params_for_base_info(reservation=reservation, language=language)

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
