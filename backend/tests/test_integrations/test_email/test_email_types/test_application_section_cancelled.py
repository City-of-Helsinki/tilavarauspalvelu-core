# type: EmailType.APPLICATION_SECTION_CANCELLED

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_application_section_cancelled
from tilavarauspalvelu.integrations.email.typing import EmailType

from tests.factories import ApplicationFactory, ApplicationSectionFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series
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
    "cancel_reason": "[PERUUTUKSEN SYY]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Your seasonal booking has been cancelled",
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Kausivarauksesi on peruttu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din säsongsbokning har avbokats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context_for_application_section_cancelled(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        assert get_context_for_application_section_cancelled(**get_mock_params(**params, language=lang)) == expected
        assert get_mock_data(email_type=EmailType.APPLICATION_SECTION_CANCELLED, **params, language=lang) == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context_for_application_section_cancelled__instance(email_reservation):
    section = email_reservation.actions.get_application_section()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
    }

    params = {
        "application_id": section.application_id,
        "application_section_id": section.id,
    }
    with TranslationsFromPOFiles():
        assert get_context_for_application_section_cancelled(**get_mock_params(**params, language="en")) == expected

    with TranslationsFromPOFiles():
        assert get_context_for_application_section_cancelled(application_section=section, language="en") == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_section_cancelled_email_text():
    context = get_mock_data(email_type=EmailType.APPLICATION_SECTION_CANCELLED, language="en")
    text_content = render_text(email_type=EmailType.APPLICATION_SECTION_CANCELLED, context=context)
    text_content = text_content.replace("&amp;", "&")

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        All space reservations included in your seasonal booking have been cancelled.
        Reason: [PERUUTUKSEN SYY]

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        You can check your booking details at: https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_section_cancelled_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_SECTION_CANCELLED, language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_SECTION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        All space reservations included in your seasonal booking have been cancelled.

        Reason: [PERUUTUKSEN SYY]
        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        You can check your booking details at: [varaamo.hel.fi](https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678)

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_application_section_cancelled_email(outbox):
    application = ApplicationFactory.create_in_status_results_sent(
        user__email="user@email.com",
        contact_person__email="contact@email.com",
    )
    application_section = application.application_sections.first()

    create_reservation_series(
        user=application_section.application.user,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
    )

    EmailService.send_application_section_cancelled(application_section=application_section)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_application_section_cancelled_email__no_reservations_email_not_sent(outbox):
    application_section = ApplicationSectionFactory.create_in_status_handled(application__user__email="user@email.com")

    EmailService.send_application_section_cancelled(application_section=application_section)

    assert len(outbox) == 0
