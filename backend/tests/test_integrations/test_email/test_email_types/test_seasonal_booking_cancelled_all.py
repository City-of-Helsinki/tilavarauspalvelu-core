# type: EmailType.SEASONAL_BOOKING_CANCELLED_ALL

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationCancelReasonChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_cancelled_all
from tilavarauspalvelu.integrations.email.typing import EmailType

from tests.factories import ApplicationFactory, ApplicationSectionFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_graphql_api.test_reservation_series.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
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
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Your seasonal booking has been cancelled",
        "cancel_reason": "My plans have changed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Kausivarauksesi on peruttu",
        "cancel_reason": "Suunnitelmiini tuli muutos",
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din säsongsbokning har avbokats",
        "cancel_reason": "Mina planer har ändrats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_cancelled_all__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_cancelled_all(**get_mock_params(**params, language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_cancelled_all__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL, **params, language=lang)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all__get_context__instance(email_reservation):
    section = email_reservation.actions.get_application_section()
    section.actions.get_reservations().update(cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS)

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_cancelled_all(section, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all_email__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL, context=context)
    text_content = text_content.replace("&amp;", "&")

    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        All space reservations included in your seasonal booking have been cancelled.
        Reason: My plans have changed

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all_email__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL, context=context)
    text_content = html_email_to_text(html_content)

    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        All space reservations included in your seasonal booking have been cancelled.

        Reason: My plans have changed
        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all__send_email(outbox):
    application = ApplicationFactory.create_in_status_results_sent(
        user__email="user@email.com",
        contact_person_email="contact@email.com",
    )
    application_section = application.application_sections.first()

    create_reservation_series(
        user=application_section.application.user,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
        reservations__cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    )

    EmailService.send_seasonal_booking_cancelled_all_email(application_section=application_section)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all__send_email__no_reservations(outbox):
    application_section = ApplicationSectionFactory.create_in_status_handled(application__user__email="user@email.com")

    EmailService.send_seasonal_booking_cancelled_all_email(application_section=application_section)

    assert len(outbox) == 0
