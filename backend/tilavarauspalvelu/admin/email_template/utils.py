from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from admin_data_views.settings import admin_data_settings
from django.urls import reverse
from django.utils.html import format_html

from tilavarauspalvelu.enums import WeekdayChoice
from tilavarauspalvelu.integrations.email.template_context.common import get_staff_reservations_ext_link
from tilavarauspalvelu.integrations.email.typing import EmailTemplateType, EmailType
from tilavarauspalvelu.translation import get_translated
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from django.utils.safestring import SafeString

    from tilavarauspalvelu.integrations.email.typing import EmailTemplateType
    from tilavarauspalvelu.typing import EmailContext, Lang


__all__ = [
    "get_mock_data",
    "get_mock_params",
]


@get_translated
def get_mock_params(*, language: Lang, **kwargs: Any) -> EmailContext:
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
        "access_code_is_used": access_code_is_used,
        "access_code": kwargs.get("access_code", "123456") if access_code_is_used else "",
        "access_code_validity_period": (
            kwargs.get("access_code_validity_period", "11:00-15:00") if access_code_is_used else ""
        ),
        "allocations": kwargs.get(
            "allocations",
            [
                {
                    "weekday_value": str(WeekdayChoice.MONDAY.label),
                    "time_value": "13:00-15:00",
                    "access_code_validity_period": "11:00-15:00" if access_code_is_used else "",
                    "series_url": get_staff_reservations_ext_link(reservation_id=1234),
                },
                {
                    "weekday_value": str(WeekdayChoice.TUESDAY.label),
                    "time_value": "21:00-22:00",
                    "access_code_validity_period": "20:45-22:05" if access_code_is_used else "",
                    "series_url": get_staff_reservations_ext_link(reservation_id=5678),
                },
            ],
        ),
        "language": language,
    }


@get_translated
def get_mock_data(*, email_type: EmailTemplateType, language: Lang, **kwargs: Any) -> EmailContext | None:
    if email_type in EmailType.access_code_always_used and "access_code_is_used" not in kwargs:
        kwargs["access_code_is_used"] = True

    mock_params = get_mock_params(language=language, **kwargs)

    # Get only the relevant parameters
    context_params = {key: mock_params[key] for key in email_type.context_variables}
    # Language is always needed
    context_params["language"] = mock_params["language"]

    return email_type.get_email_context(**context_params)


def get_preview_links(email_template_type: EmailTemplateType, *, text: bool = False) -> SafeString:
    base_url = reverse(
        viewname="admin:view_email_type",
        kwargs={"email_type": email_template_type.value},
        current_app=admin_data_settings.NAME,
    )

    text_param = "&text=true" if text else ""

    link_html_fi = format_html('<a href="{}">{}</a>', base_url + f"?lang=fi{text_param}", "FI")
    link_html_en = format_html('<a href="{}">{}</a>', base_url + f"?lang=en{text_param}", "EN")
    link_html_sv = format_html('<a href="{}">{}</a>', base_url + f"?lang=sv{text_param}", "SV")
    return format_html("<span>{} / {} / {}</span>", link_html_fi, link_html_en, link_html_sv)


def get_tester_link(email_template_type: EmailTemplateType) -> SafeString:
    tester_url = reverse(
        "admin:email_tester",
        kwargs={"email_type": email_template_type.value},
        current_app=admin_data_settings.NAME,
    )
    return format_html('<a href="{}">{}</a>', tester_url, email_template_type.label)
