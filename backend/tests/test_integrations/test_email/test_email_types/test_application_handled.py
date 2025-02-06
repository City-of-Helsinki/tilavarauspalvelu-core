# type: EmailType.APPLICATION_HANDLED

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_application_handled
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


LANGUAGE_CONTEXT = {
    "en": {
        "email_recipient_name": None,
        "text_application_handled": "Your application has been processed",
        "text_view_application": (
            "You can view the result of the processing on the "
            "'My applications' page: https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can view the result of the processing on "
            'the <a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications' page</a>"
        ),
        "title": "Your application has been processed",
        **BASE_TEMPLATE_CONTEXT_EN,
    },
    "fi": {
        "email_recipient_name": None,
        "text_application_handled": "Hakemuksesi on käsitelty",
        "text_view_application": (
            "Näet tiedon käsittelyn tuloksesta 'Omat hakemukset' -sivulla: https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Näet tiedon käsittelyn tuloksesta "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset' -sivulla</a>"
        ),
        "title": "Hakemuksesi on käsitelty",
        **BASE_TEMPLATE_CONTEXT_FI,
    },
    "sv": {
        "email_recipient_name": None,
        "text_application_handled": "Din ansökan har behandlats",
        "text_view_application": (
            "Du kan se resultatet av behandlingen på sidan 'Mina ansökningar': "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan se resultatet av behandlingen på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Mina ansökningar'</a>"
        ),
        "title": "Din ansökan har behandlats",
        **BASE_TEMPLATE_CONTEXT_SV,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context__application_handled(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        assert get_context_for_application_handled(language=lang) == expected
        assert get_mock_data(email_type=EmailType.APPLICATION_HANDLED, language=lang) == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_handled_email__text():
    context = get_mock_data(email_type=EmailType.APPLICATION_HANDLED, language="en")
    text_content = render_text(email_type=EmailType.APPLICATION_HANDLED, context=context)

    body = (
        "Your application has been processed. "
        "You can view the result of the processing on the 'My applications' page: "
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
def test_render_application_handled_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_HANDLED, language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_HANDLED, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        Your application has been processed.

        You can view the result of the processing on the ['My applications' page]({link}).

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
def test_email_service__send_application_handled_emails(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create_in_status_handled(application_round=application_round)

    EmailService.send_application_handled_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application has been processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_handled_emails__multiple_languages(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application_1 = ApplicationFactory.create_in_status_handled(
        application_round=application_round,
        user__preferred_language="fi",
    )
    application_2 = ApplicationFactory.create_in_status_handled(
        application_round=application_round,
        user__preferred_language="en",
    )

    with TranslationsFromPOFiles():
        EmailService.send_application_handled_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Hakemuksesi on käsitelty"
    assert sorted(outbox[0].bcc) == sorted([application_1.user.email, application_1.contact_person.email])

    assert outbox[1].subject == "Your application has been processed"
    assert sorted(outbox[1].bcc) == sorted([application_2.user.email, application_2.contact_person.email])


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_handled_emails__wrong_status(outbox):
    ApplicationFactory.create_in_status_handled()

    EmailService.send_application_handled_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "Zero applications require the 'application handled' email to be sent"
    )


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_handled_emails__no_recipients(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    ApplicationFactory.create_in_status_handled(
        application_round=application_round, user__email="", contact_person__email=""
    )

    EmailService.send_application_handled_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application handled emails"
