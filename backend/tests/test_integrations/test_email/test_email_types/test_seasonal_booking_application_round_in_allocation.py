# type: EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_seasonal_booking_application_round_in_allocation,
)
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
            "'My applications'</a> page"
        ),
        "title": "Your application is being processed",
        **BASE_TEMPLATE_CONTEXT_EN,
    },
    "fi": {
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
            "'Omat hakemukset'</a> -sivulla"
        ),
        "title": "Hakemustasi käsitellään",
        **BASE_TEMPLATE_CONTEXT_FI,
    },
    "sv": {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "Ansökningstiden har löpt ut. Vi skickar ett meddelande till e-postadressen när din ansökan har behandlats."
        ),
        "text_view_application": (
            "Du kan se den ansökan du har skickat på sidan 'Egna ansökningar': "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan se den ansökan du har skickat på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Egna ansökningar'</a>"
        ),
        "title": "Din ansökan behandlas",
        **BASE_TEMPLATE_CONTEXT_SV,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_application_round_in_allocation__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_application_round_in_allocation(language=lang)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_application_round_in_allocation__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION, language=lang)

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_application_round_in_allocation_email__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION, context=context)

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
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_application_round_in_allocation_email__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_APPLICATION_ROUND_IN_ALLOCATION, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi,**

        The application deadline has passed. We will notify you of the result when your application has been processed.

        You can view the application you have sent on the ['My applications']({link}) page.

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test__seasonal_booking_application_round_in_allocation__send_email(outbox):
    application = ApplicationFactory.create_in_status_in_allocation(in_allocation_notification_sent_date=None)

    EmailService.send_seasonal_booking_application_round_in_allocation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application is being processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test__seasonal_booking_application_round_in_allocation__send_email__already_sent(outbox):
    ApplicationFactory.create_in_status_in_allocation()

    EmailService.send_seasonal_booking_application_round_in_allocation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test__seasonal_booking_application_round_in_allocation__send_email__multiple_languages(outbox):
    application_1 = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="fi",
        in_allocation_notification_sent_date=None,
    )
    application_2 = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="en",
        in_allocation_notification_sent_date=None,
    )

    with TranslationsFromPOFiles():
        EmailService.send_seasonal_booking_application_round_in_allocation_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Hakemustasi käsitellään"
    assert sorted(outbox[0].bcc) == sorted([application_1.user.email, application_1.contact_person.email])

    assert outbox[1].subject == "Your application is being processed"
    assert sorted(outbox[1].bcc) == sorted([application_2.user.email, application_2.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test__seasonal_booking_application_round_in_allocation__send_email__wrong_status(outbox):
    ApplicationFactory.create_in_status_expired()

    EmailService.send_seasonal_booking_application_round_in_allocation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test__seasonal_booking_application_round_in_allocation__send_email__no_recipients(outbox):
    ApplicationFactory.create_in_status_in_allocation(
        user__email="",
        contact_person__email="",
        in_allocation_notification_sent_date=None,
    )

    EmailService.send_seasonal_booking_application_round_in_allocation_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "No recipients for the 'seasonal booking application round in allocation' email"
    )
