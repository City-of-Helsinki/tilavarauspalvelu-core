# type: EmailType.APPLICATION_IN_ALLOCATION

from __future__ import annotations

from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_application_in_allocation
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    AUTOMATIC_REPLY_CONTEXT_EN,
    AUTOMATIC_REPLY_CONTEXT_FI,
    AUTOMATIC_REPLY_CONTEXT_SV,
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    CLOSING_POLITE_CONTEXT_EN,
    CLOSING_POLITE_CONTEXT_FI,
    CLOSING_POLITE_CONTEXT_SV,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@freeze_time("2024-01-01")
def test_get_context__application_in_allocation__en():
    with TranslationsFromPOFiles():
        context = get_context_for_application_in_allocation(language="en")

    assert context == {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "The application deadline has passed. "
            "We will notify you of the result when your application has been processed."
        ),
        "text_view_application": (
            "You can view the application you have sent on the 'My applications' page: "
            "https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can view the application you have sent on the "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications' page</a>"
        ),
        "title": "Your application is being processed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__application_in_allocation__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_in_allocation(language="fi")

    assert context == {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "Hakuaika on päättynyt. Ilmoitamme käsittelyn tuloksesta, kun hakemuksesi on käsitelty."
        ),
        "text_view_application": (
            "Voit tarkastella lähettämääsi hakemusta 'Omat hakemukset' -sivulla: "
            "https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Voit tarkastella lähettämääsi hakemusta "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset' -sivulla</a>"
        ),
        "title": "Hakemustasi käsitellään",
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__application_in_allocation__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_in_allocation(language="sv")

    assert context == {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "Ansökningstiden har löpt ut. Vi skickar ett meddelande till e-postadressen när din ansökan har behandlats."
        ),
        "text_view_application": (
            "Du kan se den ansökan du har skickat på sidan 'Mina ansökningar': "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan se den ansökan du har skickat på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Mina ansökningar'</a>"
        ),
        "title": "Din ansökan behandlas",
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_in_allocation_email__text():
    context = get_mock_data(email_type=EmailType.APPLICATION_IN_ALLOCATION, language="en")
    text_content = render_text(email_type=EmailType.APPLICATION_IN_ALLOCATION, context=context)

    body = (
        "The application deadline has passed. We will notify you of the result when "
        "your application has been processed. You can view the application you have "
        "sent on the 'My applications' page: https://fake.varaamo.hel.fi/en/applications."
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
def test_render_application_in_allocation_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_IN_ALLOCATION, language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_IN_ALLOCATION, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        The application deadline has passed. We will notify you of the result when your application has been processed.

        You can view the application you have sent on the ['My applications' page]({link}).

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
def test_email_service__send_application_in_allocation_emails(outbox):
    application = ApplicationFactory.create_in_status_in_allocation(in_allocation_notification_sent_date=None)

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application is being processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__already_sent(outbox):
    ApplicationFactory.create_in_status_in_allocation()

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__multiple_languages(outbox):
    application_1 = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="fi",
        in_allocation_notification_sent_date=None,
    )
    application_2 = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="en",
        in_allocation_notification_sent_date=None,
    )

    with TranslationsFromPOFiles():
        EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Hakemustasi käsitellään"
    assert sorted(outbox[0].bcc) == sorted([application_1.user.email, application_1.contact_person.email])

    assert outbox[1].subject == "Your application is being processed"
    assert sorted(outbox[1].bcc) == sorted([application_2.user.email, application_2.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__wrong_status(outbox):
    ApplicationFactory.create_in_status_expired()

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_in_allocation_emails__no_recipients(outbox):
    ApplicationFactory.create_in_status_in_allocation(
        user__email="",
        contact_person__email="",
        in_allocation_notification_sent_date=None,
    )

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application in allocation emails"
