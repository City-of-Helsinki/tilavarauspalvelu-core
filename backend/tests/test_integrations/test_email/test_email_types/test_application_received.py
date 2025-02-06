# type: EmailType.APPLICATION_RECEIVED

from __future__ import annotations

from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_application_received
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__application_received__en():
    with TranslationsFromPOFiles():
        context = get_context_for_application_received(language="en")

    assert context == {
        "email_recipient_name": None,
        "text_application_received": "Thank you for your application",
        "text_view_application": (
            "You can edit your application on the 'My applications' page until the application deadline: "
            "https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can edit your application on the "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications' page</a> until the application deadline"
        ),
        "title": "Your application has been received",
        **BASE_TEMPLATE_CONTEXT_EN,
    }


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__application_received__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_received(language="fi")

    assert context == {
        "email_recipient_name": None,
        "text_application_received": "Kiitos hakemuksestasi",
        "text_view_application": (
            "Voit muokata hakemustasi 'Omat hakemukset' -sivulla hakuajan päättymiseen asti: "
            "https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Voit muokata hakemustasi "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset' -sivulla</a> hakuajan päättymiseen asti"
        ),
        "title": "Hakemuksesi on vastaanotettu",
        **BASE_TEMPLATE_CONTEXT_FI,
    }


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__application_received__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_received(language="sv")

    assert context == {
        "email_recipient_name": None,
        "text_application_received": "Tack för din ansökan",
        "text_view_application": (
            "Du kan redigera din ansökan på sidan 'Mina ansökningar' till och med ansökningstidens utgång: "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan redigera din ansökan på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Mina ansökningar'</a> till och med ansökningstidens utgång"
        ),
        "title": "Din ansökan har mottagits",
        **BASE_TEMPLATE_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_received_email__text():
    context = get_mock_data(email_type=EmailType.APPLICATION_RECEIVED, language="en")
    text_content = render_text(email_type=EmailType.APPLICATION_RECEIVED, context=context)

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
        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_received_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_RECEIVED, language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_RECEIVED, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        Thank you for your application.

        You can edit your application on the ['My applications' page]({link}) until the application deadline.

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_received_email(outbox):
    application = ApplicationFactory.create_in_status_received()

    EmailService.send_application_received_email(application=application)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application has been received"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_received_email__wrong_status(outbox):
    application = ApplicationFactory.create_in_status_draft()

    EmailService.send_application_received_email(application=application)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_received_email__no_recipients(outbox):
    application = ApplicationFactory.create_in_status_received(user__email="", contact_person__email="")

    EmailService.send_application_received_email(application=application)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application received email"
