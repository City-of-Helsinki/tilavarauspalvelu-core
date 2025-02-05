from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.utils.translation import pgettext

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.translation import get_attr_by_language
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.utils import update_query_params

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.models import ApplicationSection, RecurringReservation, Reservation, ReservationUnit
    from tilavarauspalvelu.typing import EmailContext, Lang


# --- Partials -----------------------------------------------------------------------------------------------------


def get_contex_for_base_template(*, email_recipient_name: str | None = None) -> EmailContext:
    return {
        "service_name": pgettext("Email", "Varaamo"),
        "current_year": str(local_datetime().year),
        "helsinki_city": pgettext("Email", "City of Helsinki"),
        "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
        "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
        "salutation": pgettext("Email", "Hi"),
        "email_recipient_name": email_recipient_name,
    }


def get_contex_for_closing(*, language: Lang) -> EmailContext:
    return {
        "with_regards": pgettext("Email", "Kind regards"),
        "service_name": pgettext("Email", "Varaamo"),
        **get_contex_for_automatic_message(language=language),
    }


def get_contex_for_closing_polite(*, language: Lang) -> EmailContext:
    return {
        "thank_you_for_using": pgettext("Email", "Thank you for choosing Varaamo!"),
        **get_contex_for_closing(language=language),
    }


def get_contex_for_closing_staff() -> EmailContext:
    return {
        "with_regards": pgettext("Email", "Kind regards"),
        "service_name": pgettext("Email", "Varaamo"),
        "automatic_message_do_not_reply": pgettext("Email", "This is an automated message, please do not reply"),
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


def get_contex_for_reservation_price(*, price: Decimal, tax_percentage: Decimal, reservation_id: int) -> EmailContext:
    return {
        "price_label": pgettext("Email", "Price"),
        "price": price,
        "vat_included_label": pgettext("Email", "incl. VAT"),
        "tax_percentage": tax_percentage,
        "booking_number_label": pgettext("Email", "Booking number"),
        "reservation_id": str(reservation_id),
    }


def get_contex_for_reservation_price_range(
    *,
    price: Decimal,
    subsidised_price: Decimal,
    tax_percentage: Decimal,
    reservation_id: int,
    applying_for_free_of_charge: bool,
) -> EmailContext:
    return {
        "price_label": pgettext("Email", "Price"),
        "price": price,
        "subsidised_price": subsidised_price,
        "price_can_be_subsidised": applying_for_free_of_charge and subsidised_price < price,
        "vat_included_label": pgettext("Email", "incl. VAT"),
        "tax_percentage": tax_percentage,
        "booking_number_label": pgettext("Email", "Booking number"),
        "reservation_id": str(reservation_id),
    }


def get_contex_for_seasonal_reservation_check_details_url(
    *,
    language: Lang,
    application_id: int | None = None,
    application_section_id: int | None = None,
) -> EmailContext:
    link = get_my_applications_ext_link(
        language=language,
        application_id=application_id,
        application_section_id=application_section_id,
    )
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


def params_for_reservation_series_info(*, reservation_series: RecurringReservation) -> dict[str, str]:
    weekdays = ", ".join(str(Weekday.from_week_day(int(val)).label) for val in reservation_series.weekdays.split(","))
    return {
        "weekday_value": weekdays,
        "time_value": f"{reservation_series.begin_time}-{reservation_series.end_time}",
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
    application_id: int | None = None,
    application_section_id: int | None = None,
) -> str:
    """
    Return the link to the 'My applications' page:
    e.g. https://varaamo.hel.fi/applications/{application_id}/view?tab=reservations&section={application_section_id}
    """
    url = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")

    if language != "fi":
        url = f"{url}/{language}"
    url = f"{url}/applications"

    if application_id:
        url = f"{url}/{application_id}/view"
        if application_section_id:
            url = f"{url}?tab=reservations&section={application_section_id}"

    return url


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
