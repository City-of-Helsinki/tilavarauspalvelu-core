from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_application_received
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


LANGUAGE_CONTEXT = {
    "en": {
        "email_recipient_name": None,
        "text_application_received": "Thank you for your application",
        "text_view_application": (
            "You can edit your application on the 'My applications' page until the application deadline: "
            "https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can edit your application on the "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications'</a> page until the application deadline"
        ),
        "title": "Your application has been received",
        **BASE_TEMPLATE_CONTEXT_EN,
    },
    "fi": {
        "email_recipient_name": None,
        "text_application_received": "Kiitos hakemuksestasi",
        "text_view_application": (
            "Voit muokata hakemustasi 'Omat hakemukset' -sivulla hakuajan päättymiseen asti: "
            "https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Voit muokata hakemustasi "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset'</a> -sivulla hakuajan päättymiseen asti"
        ),
        "title": "Hakemuksesi on vastaanotettu",
        **BASE_TEMPLATE_CONTEXT_FI,
    },
    "sv": {
        "email_recipient_name": None,
        "text_application_received": "Tack för din ansökan",
        "text_view_application": (
            "Du kan redigera din ansökan på sidan 'Egna ansökningar' till och med ansökningstidens utgång: "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan redigera din ansökan på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Egna ansökningar'</a> till och med ansökningstidens utgång"
        ),
        "title": "Din ansökan har mottagits",
        **BASE_TEMPLATE_CONTEXT_SV,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_application_received__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_application_received(language=lang)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_application_received__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED, language=lang)

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_application_received_email__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED, context=context)

    body = (
        "Thank you for your application. "
        "You can edit your application on the 'My applications' page until the application deadline: "
        "https://fake.varaamo.hel.fi/en/applications."
    )

    assert text_content == cleandoc(
        f"""
        Hi

        {body}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_application_received_email__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_RECEIVED, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi,**

        Thank you for your application.

        You can edit your application on the ['My applications']({link}) page until the application deadline.

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_seasonal_booking_application_received__send_email(outbox):
    application = ApplicationFactory.create_in_status_received()

    EmailService.send_seasonal_booking_application_received_email(application=application)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application has been received"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person_email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_seasonal_booking_application_received__send_email__wrong_status(outbox):
    application = ApplicationFactory.create_in_status_draft()

    EmailService.send_seasonal_booking_application_received_email(application=application)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_seasonal_booking_application_received__send_email__no_recipients(outbox):
    application = ApplicationFactory.create_in_status_received(user__email="", contact_person_email="")

    EmailService.send_seasonal_booking_application_received_email(application=application)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "No recipients for the 'seasonal booking application received' email"
    )
