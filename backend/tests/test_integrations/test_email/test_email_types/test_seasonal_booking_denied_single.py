# type: EmailType.SEASONAL_BOOKING_DENIED_SINGLE

from __future__ import annotations

import datetime
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_denied_single
from tilavarauspalvelu.integrations.email.typing import EmailType

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
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
    "rejection_reason": "[HYLKÄYKSEN SYY]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "The space reservation included in your seasonal booking has been cancelled",
        "text_reservation_rejected": "The space reservation included in your seasonal booking has been cancelled",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "text_reservation_rejected": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "text_reservation_rejected": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_denied_single__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_denied_single(**get_mock_params(**params, language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_denied_single__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_DENIED_SINGLE, **params, language=lang)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_denied_single__get_context__instance(email_reservation):
    section = email_reservation.actions.get_application_section()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_denied_single(email_reservation, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_denied_single__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_DENIED_SINGLE, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_DENIED_SINGLE, context=context)
    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The space reservation included in your seasonal booking has been cancelled.
        Reason: [HYLKÄYKSEN SYY]

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_denied_single__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_DENIED_SINGLE, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_DENIED_SINGLE, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The space reservation included in your seasonal booking has been cancelled.

        Reason: [HYLKÄYKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_denied_single__send_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.SEASONAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_seasonal_booking_denied_single_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "The space reservation included in your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]
