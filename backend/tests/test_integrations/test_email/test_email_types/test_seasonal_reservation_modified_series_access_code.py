# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE


from __future__ import annotations

import datetime
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationTypeChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context.reservation import (
    get_context_for_seasonal_reservation_modified_series_access_code,
)
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraReservationSeriesResponse
from utils.date_utils import local_datetime

from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
    KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
    KEYLESS_ENTRY_CONTEXT_EN,
    KEYLESS_ENTRY_CONTEXT_FI,
    KEYLESS_ENTRY_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
    get_application_details_urls,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
    "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
    "time_value": "13:00-15:00",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "The door code has changed",
        "text_reservation_modified": "The door code has changed",
        "weekday_value": "Monday",
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Ovikoodi on vaihtunut",
        "text_reservation_modified": "Ovikoodi on vaihtunut",
        "weekday_value": "Maanantai",
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Dörrkoden har ändrats",
        "text_reservation_modified": "Dörrkoden har ändrats",
        "weekday_value": "Måndag",
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context_for_seasonal_reservation_modified_series_access_code(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "access_code_is_used": True,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series_access_code(**get_mock_params(**params))
        assert context == expected

        context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE, **params)
        assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(
    PindoraClient.get_reservation_series,
    return_value=PindoraReservationSeriesResponse(
        access_code="123456",
        reservation_unit_code_validity=[
            {"begin": datetime.datetime(2024, 1, 1, 11), "end": datetime.datetime(2024, 1, 1, 15)}
        ],
    ),
)
def test_get_context_for_seasonal_reservation_modified_series_access_codes__instance(email_reservation):
    section = email_reservation.actions.get_application_section()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
    }

    params = {
        "application_id": section.application_id,
        "application_section_id": section.id,
        "access_code_is_used": True,
        "language": "en",
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series_access_code(**get_mock_params(**params))
        assert context == expected

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series_access_code(
            reservation_series=email_reservation.recurring_reservation,
            language="en",
        )
        assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_modified_series_access_code__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE, context=context)
    text_content = text_content.replace("&amp;", "&")

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The door code has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        Day: Monday
        Time: 13:00-15:00

        Door code: 123456
        Validity period of the door code: 11:00-15:00

        You can check your booking details at: https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_modified_series_access_code__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES_ACCESS_CODE, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The door code has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        Day: Monday
        Time: 13:00-15:00
        Door code: 123456
        Validity period of the door code: 11:00-15:00
        You can check your booking details at: [varaamo.hel.fi](https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678)

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(
    PindoraClient.get_reservation_series,
    return_value=PindoraReservationSeriesResponse(
        access_code="123456",
        reservation_unit_code_validity=[
            {"begin": datetime.datetime(2024, 1, 1, 11), "end": datetime.datetime(2024, 1, 1, 15)}
        ],
    ),
)
def test_email_service__send_seasonal_reservation_modified_series_access_code(outbox):
    reservation_series = create_reservation_series(
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application__user__email="user@email.com",
        allocated_time_slot__reservation_unit_option__application_section__application__contact_person__email="contact@email.com",
        allocated_time_slot__reservation_unit_option__application_section__application__sent_date=local_datetime(),
        allocated_time_slot__reservation_unit_option__application_section__application__application_round__sent_date=local_datetime(),
    )

    EmailService.send_seasonal_reservation_modified_series_access_code_email(reservation_series=reservation_series)

    assert len(outbox) == 1

    assert outbox[0].subject == "The door code has changed"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_seasonal_reservation_modified_series_access_code__email_not_sent__no_allocated_time_slot(
    outbox,
):
    reservation_series = create_reservation_series(
        user__email="user@email.com",
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__reservee_email="reservee@email.com",
        allocated_time_slot=None,
    )

    EmailService.send_seasonal_reservation_modified_series_access_code_email(reservation_series=reservation_series)

    assert len(outbox) == 0
