from __future__ import annotations

from typing import TYPE_CHECKING, Any, overload

from django.utils.translation import pgettext

from tilavarauspalvelu.translation import get_attr_by_language, get_translated

from .common import (
    create_anchor_tag,
    get_contex_for_base_template,
    get_contex_for_closing,
    get_contex_for_closing_polite,
    get_contex_for_closing_staff,
    get_contex_for_seasonal_reservation_check_details_url,
    get_my_applications_ext_link,
    get_staff_reservations_ext_link,
    params_for_application_section_info,
    params_for_reservation_series_info,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_context_for_application_handled",
    "get_context_for_application_in_allocation",
    "get_context_for_application_received",
    "get_context_for_application_section_cancelled",
]


# type: EmailType.APPLICATION_HANDLED ##################################################################################


@get_translated
def get_context_for_application_handled(*, language: Lang) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "'My applications' page")

    text_view_application = pgettext("Email", "You can view the result of the processing on the %(page)s")

    return {
        "title": pgettext("Email", "Your application has been processed"),
        "text_application_handled": pgettext("Email", "Your application has been processed"),
        "text_view_application_html": text_view_application % {"page": create_anchor_tag(link=link, text=text)},
        "text_view_application": text_view_application % {"page": f"{text}: {link}"},
        **get_contex_for_base_template(),
        **get_contex_for_closing_polite(language=language),
    }


# type: EmailType.APPLICATION_IN_ALLOCATION ############################################################################


@get_translated
def get_context_for_application_in_allocation(*, language: Lang) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "'My applications' page")

    text_view_application = pgettext("Email", "You can view the application you have sent on the %(page)s")

    return {
        "title": pgettext("Email", "Your application is being processed"),
        "text_application_in_allocation": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "The application deadline has passed. "
            "We will notify you of the result when your application has been processed.",
        ),
        "text_view_application_html": text_view_application % {"page": create_anchor_tag(link=link, text=text)},
        "text_view_application": text_view_application % {"page": f"{text}: {link}"},
        **get_contex_for_base_template(),
        **get_contex_for_closing_polite(language=language),
    }


# type: EmailType.APPLICATION_RECEIVED #################################################################################


@get_translated
def get_context_for_application_received(*, language: Lang) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "'My applications' page")

    text_view_application = pgettext(
        "Email",
        "You can edit your application on the %(page)s until the application deadline",
    )

    return {
        "title": pgettext("Email", "Your application has been received"),
        "text_application_received": pgettext("Email", "Thank you for your application"),
        "text_view_application_html": text_view_application % {"page": create_anchor_tag(link=link, text=text)},
        "text_view_application": text_view_application % {"page": text} + f": {link}",
        **get_contex_for_base_template(),
        **get_contex_for_closing_polite(language=language),
    }


# type: EmailType.APPLICATION_SECTION_CANCELLED ########################################################################


@overload
def get_context_for_application_section_cancelled(
    application_section: ApplicationSection, *, language: Lang
) -> EmailContext: ...


@overload
def get_context_for_application_section_cancelled(
    *,
    language: Lang,
    cancel_reason: str,
    email_recipient_name: str,
    weekday_value: str,
    time_value: str,
    application_section_name: str,
    application_round_name: str,
) -> EmailContext: ...


@get_translated
def get_context_for_application_section_cancelled(
    application_section: ApplicationSection | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if application_section is not None:
        reservation = application_section.actions.get_last_reservation()
        data: dict[str, Any] = {
            "email_recipient_name": application_section.application.applicant,
            "cancel_reason": get_attr_by_language(reservation.cancel_reason, "reason", language),
            **params_for_application_section_info(application_section=application_section, language=language),
        }

    return {
        "title": pgettext("Email", "Your seasonal booking has been cancelled"),
        "text_reservation_cancelled": pgettext(
            "Email", "All space reservations included in your seasonal booking have been cancelled"
        ),
        "cancel_reason_label": pgettext("Email", "Reason"),
        "cancel_reason": data["cancel_reason"],
        "seasonal_booking_label": pgettext("Email", "Seasonal Booking"),
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        **get_contex_for_base_template(email_recipient_name=data["email_recipient_name"]),
        **get_contex_for_seasonal_reservation_check_details_url(language=language),
        **get_contex_for_closing(language=language),
    }


# type: EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED #####################################################


@overload
def get_context_for_staff_notification_application_section_cancelled(
    application_section: ApplicationSection, *, language: Lang, **data: Any
) -> EmailContext: ...


@overload
def get_context_for_staff_notification_application_section_cancelled(
    *,
    language: Lang,
    cancel_reason: str,
    application_section_name: str,
    application_round_name: str,
    cancelled_reservation_series: list[dict[str, str]],
) -> EmailContext: ...


@get_translated
def get_context_for_staff_notification_application_section_cancelled(
    application_section: ApplicationSection | None = None,
    *,
    language: Lang,
    **data: Any,
) -> EmailContext:
    if application_section is not None:
        reservation_series_data = [
            {
                **params_for_reservation_series_info(reservation_series=series),
                "reservation_url": get_staff_reservations_ext_link(
                    reservation_id=series.reservations.values_list("pk", flat=True).last()
                ),
            }
            for series in application_section.actions.get_reservation_series()
        ]

        reservation = application_section.actions.get_last_reservation()
        data: dict[str, Any] = {
            "cancel_reason": get_attr_by_language(reservation.cancel_reason, "reason", language),
            "cancelled_reservation_series": reservation_series_data,
            **params_for_application_section_info(application_section=application_section, language=language),
        }

    return {
        "title": pgettext("Email", "The customer has canceled the seasonal booking"),
        "text_reservation_cancelled": pgettext(
            "Email", "The customer has canceled all space reservations included in the seasonal booking"
        ),
        "cancel_reason_label": pgettext("Email", "Reason"),
        "cancel_reason": data["cancel_reason"],
        "seasonal_booking_label": pgettext("Email", "Seasonal Booking"),
        "view_booking_at_label": pgettext("Email", "You can view the booking at"),
        "application_section_name": data["application_section_name"],
        "application_round_name": data["application_round_name"],
        "cancelled_reservation_series": data["cancelled_reservation_series"],
        **get_contex_for_base_template(),
        **get_contex_for_closing_staff(),
    }
