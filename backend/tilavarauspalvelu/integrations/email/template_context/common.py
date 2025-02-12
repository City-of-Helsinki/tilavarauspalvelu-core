from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.utils.translation import pgettext

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.translation import get_attr_by_language
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, local_time_string
from utils.utils import update_query_params

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.models import ApplicationSection, RecurringReservation, Reservation, ReservationUnit
    from tilavarauspalvelu.typing import EmailContext, Lang


# --- Partials -----------------------------------------------------------------------------------------------------


def get_context_for_translations(*, language: Lang, email_recipient_name: str | None) -> EmailContext:
    return {
        "email_recipient_name": email_recipient_name,
        "current_year": str(local_datetime().year),
        "service_name": pgettext("Email", "Varaamo"),
        "helsinki_city": pgettext("Email", "City of Helsinki"),
        "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
        "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
        "salutation": pgettext("Email", "Hi"),
        "with_regards": pgettext("Email", "Kind regards"),
        "thank_you_for_using": pgettext("Email", "Thank you for choosing Varaamo!"),
        "reason_label": pgettext("Email", "Reason"),
        "reason_cancel_label": pgettext("Email", "Your reason for cancellation"),
        **get_contex_for_automatic_message(language=language),
        **get_context_for_reservation_translations(),
        **get_context_for_application_translations(),
    }


def get_contex_for_automatic_message(*, language: Lang) -> EmailContext:
    link_varaamo = get_varaamo_ext_link(language=language)
    text_varaamo = "varaamo.hel.fi"
    varaamo_page_link = create_anchor_tag(link=link_varaamo, text=text_varaamo)

    link_feedback = get_feedback_ext_link(language=language)
    text_feedback = pgettext("Email", "Contact us")
    contact_us_page_link = create_anchor_tag(link=link_feedback, text=text_feedback)

    reserve_city_resources_at = pgettext(
        "Email",
        "Book the city's premises and equipment for your use at %(link)s",
    )

    return {
        "automatic_message_do_not_reply": pgettext("Email", "This is an automated message, please do not reply"),
        "contact_us_html": contact_us_page_link,
        "contact_us": f"{text_feedback}: {link_feedback}",
        "reserve_city_resources_at_html": reserve_city_resources_at % {"link": varaamo_page_link},
        "reserve_city_resources_at": reserve_city_resources_at % {"link": link_varaamo},
    }


def get_context_for_reservation_translations() -> EmailContext:
    return {
        "booking_number_label": pgettext("Email", "Booking number"),
        "reservee_name_label": pgettext("Email", "Reservee name"),
        "instructions_booking_label": pgettext("Email", "Additional information about your booking"),
        "instructions_cancelled_label": pgettext("Email", "Additional information about cancellation"),
        "instructions_rejected_label": pgettext("Email", "Additional information"),
        "weekday_label": pgettext("Email", "Day"),
        "time_label": pgettext("Email", "Time"),
        "text_view_booking_at": pgettext("Email", "You can view the booking at"),
        "text_view_and_handle_at": pgettext("Email", "You can view and handle the booking at"),
        "text_reservation_cancelled": pgettext("Email", "Your booking has been cancelled"),
        "text_seasonal_reservation_cancelled": pgettext(
            "Email", "The space reservation included in your seasonal booking has been cancelled"
        ),
    }


def get_context_for_application_translations() -> EmailContext:
    return {
        "seasonal_booking_label": pgettext("Email", "Seasonal Booking"),
        "view_booking_at_label": pgettext("Email", "You can view the booking at"),
        "text_seasonal_cancelled_by_staff": pgettext(
            "Email", "All space reservations included in your seasonal booking have been cancelled"
        ),
        "text_seasonal_cancelled_by_customer": pgettext(
            "Email", "The customer has canceled all space reservations included in the seasonal booking"
        ),
    }


def get_contex_for_reservation_basic_info(
    *,
    reservation_unit_name: str,
    unit_name: str,
    unit_location: str,
    begin_datetime: datetime.datetime,
    end_datetime: datetime.datetime,
) -> EmailContext:
    return {
        "reservation_unit_name": reservation_unit_name,
        "unit_name": unit_name,
        "unit_location": unit_location,
        "begins_label": pgettext("Email", "From"),
        "begin_date": begin_datetime.date().strftime("%-d.%-m.%Y"),
        "begin_time": begin_datetime.timetz().strftime("%H:%M"),
        "ends_label": pgettext("Email", "To"),
        "end_date": end_datetime.date().strftime("%-d.%-m.%Y"),
        "end_time": end_datetime.timetz().strftime("%H:%M"),
        "o_clock_label": pgettext("Email", "at"),
    }


def get_contex_for_reservation_manage_link(*, language: Lang) -> EmailContext:
    link = get_my_reservations_ext_link(language=language)
    text = pgettext("Email", "'My bookings' page")

    manage_reservation = pgettext(
        "Email",
        # NOTE: Must format like this so that Django can discover the translation.
        "Manage your booking at Varaamo. You can check the details of your booking and "
        "Varaamo's terms of contract and cancellation on the %(page)s.",
    )

    return {
        "manage_reservation_html": manage_reservation % {"page": create_anchor_tag(link=link, text=text)},
        "manage_reservation": manage_reservation % {"page": f"{text}: {link}"},
    }


def get_contex_for_reservation_price(
    *,
    price: Decimal,
    tax_percentage: Decimal,
    reservation_id: int,
    subsidised_price: Decimal | None = None,
    applying_for_free_of_charge: bool = False,
) -> EmailContext:
    if subsidised_price is None:
        subsidised_price = price

    return {
        "price_label": pgettext("Email", "Price"),
        "price": price,
        "subsidised_price": subsidised_price,
        "price_can_be_subsidised": applying_for_free_of_charge and subsidised_price < price,
        "vat_included_label": pgettext("Email", "incl. VAT"),
        "tax_percentage": tax_percentage,
        "reservation_id": str(reservation_id),
    }


def get_context_for_keyless_entry(
    *,
    language: Lang,
    access_code_is_used: bool,
    access_code: str,
    access_code_validity_period: str,
) -> EmailContext:
    my_reservations_link = get_my_reservations_ext_link(language=language)
    my_reservations_text = pgettext("Email", "'My bookings' page")

    feedback_link = get_feedback_ext_link(language=language)
    feedback_text = pgettext("Email", "Varaamo customer service")

    unavailable_instructions = pgettext(
        "Email",
        "You can see the door code on the %(my_reservations)s at Varaamo. "
        "If the code is not visible in your booking details, please contact %(customer_service)s.",
    )

    return {
        "access_code_is_used": access_code_is_used,
        "access_code": access_code,
        "access_code_validity_period": access_code_validity_period,
        "access_code_label": pgettext("Email", "Door code"),
        "access_code_validity_period_label": pgettext("Email", "Validity period of the door code"),
        "text_access_code_to_access": pgettext("Email", "You can access the space with the door code"),
        "text_access_code_confirmed": pgettext(
            "Email", "Here are your booking details and the door code for easy access to the space"
        ),
        "text_access_code_modified": pgettext("Email", "The door code has changed"),
        "text_access_code_unavailable_instructions_html": unavailable_instructions
        % {
            "my_reservations": create_anchor_tag(link=my_reservations_link, text=my_reservations_text),
            "customer_service": create_anchor_tag(link=feedback_link, text=feedback_text),
        },
        "text_access_code_unavailable_instructions": unavailable_instructions
        % {
            "my_reservations": f"{my_reservations_link}: {my_reservations_text}",
            "customer_service": f"{feedback_link}: {feedback_text}",
        },
    }


def get_contex_for_seasonal_reservation_check_details_url(
    *,
    language: Lang,
    application_id: int | None = None,
    application_section_id: int | None = None,
) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    # e.g. https://varaamo.hel.fi/applications/{application_id}/view?tab=reservations&section={application_section_id}
    if application_id:
        link = f"{link}/{application_id}/view"
        if application_section_id:
            link = f"{link}?tab=reservations&section={application_section_id}"
    text = "varaamo.hel.fi"

    return {
        "check_booking_details_text": pgettext("Email", "You can check your booking details at"),
        "check_booking_details_url_html": create_anchor_tag(link=link, text=text),
        "check_booking_details_url": link,
    }


# --- Params for contexts ------------------------------------------------------------------------------------------


def params_for_base_info(*, reservation: Reservation, language: Lang) -> dict[str, Any]:
    # Currently, there is ever only one reservation unit per reservation.
    primary: ReservationUnit = reservation.reservation_units.select_related("unit__location").first()

    return {
        "reservation_unit_name": get_attr_by_language(primary, "name", language),
        "unit_name": get_attr_by_language(primary.unit, "name", language),
        "unit_location": primary.actions.get_address(),
        "begin_datetime": reservation.begin.astimezone(DEFAULT_TIMEZONE),
        "end_datetime": reservation.end.astimezone(DEFAULT_TIMEZONE),
    }


def params_for_price_info(*, reservation: Reservation) -> dict[str, Any]:
    return {
        "price": reservation.price,
        "tax_percentage": reservation.tax_percentage_value,
        "reservation_id": reservation.id,
    }


def params_for_price_range_info(*, reservation: Reservation) -> dict[str, Any]:
    begin_datetime = reservation.begin.astimezone(DEFAULT_TIMEZONE)
    end_datetime = reservation.end.astimezone(DEFAULT_TIMEZONE)

    subsidised_price = reservation.actions.calculate_full_price(begin_datetime, end_datetime, subsidised=True)

    return {
        "price": reservation.price,
        "subsidised_price": subsidised_price,
        "applying_for_free_of_charge": reservation.applying_for_free_of_charge,
        "tax_percentage": reservation.tax_percentage_value,
        "reservation_id": reservation.id,
    }


def params_for_keyless_entry(*, reservation: Reservation) -> dict[str, Any]:
    if not reservation.access_code_should_be_active:
        return {
            "access_code_is_used": False,
            "access_code": "",
            "access_code_validity_period": "",
        }

    try:
        response = PindoraClient.get_reservation(reservation=reservation)
    except PindoraNotFoundError:
        # Reservation should have an access code, but it is not available.
        return {
            "access_code_is_used": True,
            "access_code": "",
            "access_code_validity_period": "",
        }

    time_str = f"{local_time_string(response['begin'].time())}-{local_time_string(response['end'].time())}"
    return {
        "access_code_is_used": True,
        "access_code": response["access_code"],
        "access_code_validity_period": time_str,
    }


def params_for_reservation_series_info(*, reservation_series: RecurringReservation) -> dict[str, str]:
    weekdays = ", ".join(str(Weekday.from_week_day(int(val)).label) for val in reservation_series.weekdays.split(","))
    start_time = reservation_series.begin_time
    end_time = reservation_series.end_time
    return {
        "weekday_value": weekdays,
        "time_value": f"{local_time_string(start_time)}-{local_time_string(end_time)}",
    }


def params_for_application_section_info(*, application_section: ApplicationSection, language: Lang) -> dict[str, str]:
    return {
        "application_section_name": application_section.name,
        "application_round_name": get_attr_by_language(
            application_section.application.application_round, "name", language=language
        ),
    }


# --- Links --------------------------------------------------------------------------------------------------------


def get_varaamo_ext_link(*, language: Lang) -> str:
    url_base = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")
    if language != "fi":
        return f"{url_base}/{language}"
    return url_base


def get_my_applications_ext_link(
    *,
    language: Lang,
) -> str:
    """
    Return the link to the 'My applications' page:
    e.g. https://varaamo.hel.fi/applications
    """
    url = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")

    if language != "fi":
        url = f"{url}/{language}"
    return f"{url}/applications"


def get_my_reservations_ext_link(*, language: Lang) -> str:
    url_base = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")
    if language != "fi":
        return f"{url_base}/{language}/reservations"
    return f"{url_base}/reservations"


def get_staff_login_link() -> str:
    url_base = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")
    return f"{url_base}/kasittely"


def get_staff_reservations_ext_link(*, reservation_id: int) -> str:
    url_base = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")
    return f"{url_base}/kasittely/reservations/{reservation_id}"


def get_feedback_ext_link(*, language: Lang) -> str:
    url_base = settings.EMAIL_FEEDBACK_EXT_LINK.removesuffix("/")
    return update_query_params(url=url_base, lang=language)


def create_anchor_tag(*, link: str, text: str | None = None) -> str:
    if text is None:
        text = link
    return f'<a href="{link}">{text}</a>'
