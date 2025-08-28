from __future__ import annotations

import datetime
from collections import defaultdict
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db.models import Prefetch
from django.utils.translation import pgettext
from lookup_property import L

from tilavarauspalvelu.enums import AccessType, Weekday
from tilavarauspalvelu.models import ReservationUnitAccessType
from tilavarauspalvelu.translation import get_attr_by_language
from utils.date_utils import DEFAULT_TIMEZONE, local_date_string, local_datetime, local_time_string
from utils.utils import update_query_params

if TYPE_CHECKING:
    from collections.abc import Iterable
    from decimal import Decimal

    from tilavarauspalvelu.models import ApplicationSection, Reservation, ReservationSeries, ReservationUnit, Unit
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

    reserve_city_resources_at = pgettext("Email", "Book the city's premises and equipment for your use at %(link)s")

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
    text = pgettext("Email", "My bookings")
    text = f"{text!r}"

    body = pgettext(
        "Email",
        # NOTE: Must format like this so that Django can discover the translation.
        "Manage your booking at Varaamo. You can check the details of your booking and "
        "Varaamo's terms of contract and cancellation on the %(my_bookings)s page.",
    )
    body_html = body % {"my_bookings": create_anchor_tag(link=link, text=text)}
    body_text = body % {"my_bookings": f"{text} ({link})"}

    return {
        "manage_reservation_html": body_html,
        "manage_reservation": body_text,
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
    my_reservations_text = pgettext("Email", "My bookings")
    my_reservations_text = f"{my_reservations_text!r}"

    feedback_link = get_feedback_ext_link(language=language)
    feedback_text = pgettext("Email", "Varaamo customer service")

    instructions = pgettext(
        "Email",
        "You can see the door code on the %(my_reservations)s page at Varaamo. "
        "If the code is not visible in your booking details, please contact %(customer_service)s.",
    )
    instructions_html = instructions % {
        "my_reservations": create_anchor_tag(link=my_reservations_link, text=my_reservations_text),
        "customer_service": create_anchor_tag(link=feedback_link, text=feedback_text),
    }
    instructions_text = instructions % {
        "my_reservations": f"{my_reservations_text} ({my_reservations_link})",
        "customer_service": f"{feedback_text} ({feedback_link})",
    }

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
        "text_access_code_unavailable_instructions_html": instructions_html,
        "text_access_code_unavailable_instructions": instructions_text,
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
    reservation_unit = reservation.reservation_unit
    unit: Unit = reservation_unit.unit

    return {
        "reservation_unit_name": get_attr_by_language(reservation_unit, "name", language),
        "unit_name": get_attr_by_language(unit, "name", language),
        "unit_location": unit.address,
        "begin_datetime": reservation.begins_at.astimezone(DEFAULT_TIMEZONE),
        "end_datetime": reservation.ends_at.astimezone(DEFAULT_TIMEZONE),
    }


def params_for_price_info(*, reservation: Reservation) -> dict[str, Any]:
    return {
        "price": reservation.price,
        "tax_percentage": reservation.tax_percentage_value,
        "reservation_id": reservation.id,
    }


def params_for_price_range_info(*, reservation: Reservation) -> dict[str, Any]:
    begin_datetime = reservation.begins_at.astimezone(DEFAULT_TIMEZONE)
    end_datetime = reservation.ends_at.astimezone(DEFAULT_TIMEZONE)

    subsidised_price = reservation.actions.calculate_full_price(begin_datetime, end_datetime, subsidised=True)

    return {
        "price": reservation.price,
        "subsidised_price": subsidised_price,
        "applying_for_free_of_charge": reservation.applying_for_free_of_charge,
        "tax_percentage": reservation.tax_percentage_value,
        "reservation_id": reservation.id,
    }


def params_for_access_code_reservation(*, reservation: Reservation) -> dict[str, Any]:
    from tilavarauspalvelu.integrations.keyless_entry import PindoraService
    from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError

    params = {
        "access_code": "",
        "access_code_is_used": False,
        "access_code_validity_period": "",
    }

    if not reservation.access_code_should_be_active:
        return params

    params["access_code_is_used"] = True

    try:
        response = PindoraService.get_access_code(obj=reservation)
    except PindoraNotFoundError:
        return params

    # If access code is not actually active, even when we think it should be, don't show it in emails
    if not response.access_code_is_active:
        return params

    params["access_code"] = response.access_code

    begin_time = local_time_string(response.access_code_begins_at.time())
    end_time = local_time_string(response.access_code_ends_at.time())
    params["access_code_validity_period"] = f"{begin_time}-{end_time}"

    return params


def params_for_access_code_series(*, series: ReservationSeries) -> dict[str, Any]:
    from tilavarauspalvelu.integrations.keyless_entry import PindoraService
    from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError

    params = {
        "access_code": "",
        "access_code_is_used": False,
        "access_code_validity_period": "",
    }

    if not series.should_have_active_access_code:
        return params

    params["access_code_is_used"] = True

    try:
        response = PindoraService.get_access_code(series)
    except PindoraNotFoundError:
        return params

    # If access code is not actually active, even when we think it should be, don't show it in emails
    if not response.access_code_is_active:
        return params

    params["access_code"] = response.access_code

    # All reservations in the series should start at the same time, so we can just use the first one.
    validity = next(iter(response.access_code_validity), None)  # type: ignore
    if validity is not None:
        begin_time = local_time_string(validity.access_code_begins_at.time())
        end_time = local_time_string(validity.access_code_ends_at.time())
        params["access_code_validity_period"] = f"{begin_time}-{end_time}"

    return params


def params_for_access_code_section(*, section: ApplicationSection) -> dict[str, Any]:
    from tilavarauspalvelu.integrations.keyless_entry import PindoraService
    from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError

    all_allocations = _initialize_allocations_map(section)

    params = {
        "access_code": "",
        "access_code_is_used": False,
        "allocations": _compile_allocations_map(all_allocations),
    }

    if not section.should_have_active_access_code:
        return params

    params["access_code_is_used"] = True

    try:
        response = PindoraService.get_access_code(section)
    except PindoraNotFoundError:
        return params

    # If access code is not actually active, even when we think it should be, don't show it in emails
    if not response.access_code_is_active:
        return params

    params["access_code"] = response.access_code

    allocations_using_access_codes: defaultdict[int, dict[Weekday, dict[str, str]]] = defaultdict(dict)

    for validity in response.access_code_validity:
        weekday = Weekday.from_week_day(validity.access_code_begins_at.weekday())

        allocation = all_allocations[validity.reservation_series_id].get(weekday)
        if allocation is None:
            continue

        # We only want to to include series that use access codes in the final output,
        # so we need to transfer the data from the "all" map to the "final" map.
        allocations_using_access_codes[validity.reservation_series_id][weekday] = allocation

        begin_time = local_time_string(validity.access_code_begins_at.time())
        end_time = local_time_string(validity.access_code_ends_at.time())

        allocation["access_code_validity_period"] = f"{begin_time}-{end_time}"

    params["allocations"] = _compile_allocations_map(allocations_using_access_codes)

    return params


def params_for_access_type_change_section(*, section: ApplicationSection) -> dict[str, Any]:
    reservation_units: Iterable[ReservationUnit] = (
        section.actions.get_reservation_units()
        .select_related("unit")
        .prefetch_related(
            Prefetch(
                "access_types",
                queryset=(
                    ReservationUnitAccessType.objects.all()
                    .annotate(end_date=L("end_date"))
                    .on_period(begin_date=section.reservations_begin_date, end_date=section.reservations_end_date)
                ),
            ),
        )
    )

    return {
        "reservation_units": [
            {
                "reservation_unit_name": reservation_unit.name,
                "unit_name": reservation_unit.unit.name,
                "unit_location": reservation_unit.unit.address,
                "access_types": [
                    {
                        "access_type": str(AccessType(access.access_type).label),
                        "begin_date": local_date_string(access.begin_date),
                        "end_date": (
                            local_date_string(access.end_date - datetime.timedelta(days=1))
                            if access.end_date != datetime.date.max
                            else None
                        ),
                    }
                    for access in reservation_unit.access_types.all()
                ],
            }
            for reservation_unit in reservation_units
        ],
    }


def params_for_access_code_section_plain(*, section: ApplicationSection) -> dict[str, Any]:
    """Access code for email without allocation specific information"""
    from tilavarauspalvelu.integrations.keyless_entry import PindoraService
    from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError

    params = {
        "access_code": "",
        "access_code_is_used": False,
    }

    if not section.should_have_active_access_code:
        return params

    params["access_code_is_used"] = True

    try:
        response = PindoraService.get_access_code(section)
    except PindoraNotFoundError:
        return params

    # If access code is not actually active, even when we think it should be, don't show it in emails
    if not response.access_code_is_active:
        return params

    params["access_code"] = response.access_code
    return params


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


def get_reservation_ext_link(reservation_number: int, *, language: Lang) -> str:
    url_base = settings.EMAIL_VARAAMO_EXT_LINK.removesuffix("/")
    if language != "fi":
        return f"{url_base}/{language}/reservations/{reservation_number}"
    return f"{url_base}/reservations/{reservation_number}"


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


# --- Helpers -----------------------------------------------------------------------------------------------------


def get_section_allocation(*, section: ApplicationSection) -> list[dict[str, Any]]:
    allocations_map = _initialize_allocations_map(section)
    return _compile_allocations_map(allocations_map)


type AllocationsMap = defaultdict[int, dict[Weekday, dict[str, str]]]


def _initialize_allocations_map(section: ApplicationSection) -> AllocationsMap:
    """
    Initializes a map of allocation data for a given series.
    Map can be compiled with `_compile_allocations_map` missing values have been filled in.
    """
    allocations_map: AllocationsMap = defaultdict(dict)

    series: ReservationSeries
    for series in section.actions.get_reservation_series():
        begin_time = local_time_string(series.begin_time)  # type: ignore[arg-type]
        end_time = local_time_string(series.end_time)  # type: ignore[arg-type]

        reservation = series.reservations.last()
        reservation_unit = series.reservation_unit

        for weekday in series.weekdays:
            allocations_map[series.id][Weekday(weekday)] = {
                "time_value": f"{begin_time}-{end_time}",
                "access_code_validity_period": "",  # Can be filled in later if access codes are used
                "series_url": get_staff_reservations_ext_link(reservation_id=reservation.pk),
                "unit_name": reservation_unit.unit.name,  # type: ignore[union-attr]
                "unit_location": reservation_unit.unit.address,
                "reservation_unit_name": reservation_unit.name,
            }

    return allocations_map


def _compile_allocations_map(allocations_map: AllocationsMap) -> list[dict[str, Any]]:
    """Complies the allocation map created with `_initialize_allocations_map`."""
    return [
        {
            "weekday_value": str(weekday.label),
            "time_value": allocation["time_value"],
            "access_code_validity_period": allocation["access_code_validity_period"],
            "series_url": allocation["series_url"],
            "unit_name": allocation["unit_name"],
            "unit_location": allocation["unit_location"],
            "reservation_unit_name": allocation["reservation_unit_name"],
        }
        for weekday_map in allocations_map.values()
        for weekday, allocation in weekday_map.items()
    ]
