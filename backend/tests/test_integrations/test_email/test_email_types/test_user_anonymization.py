# type: EmailType.USER_ANONYMIZATION

from __future__ import annotations

import datetime
from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType, Language
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_user_anonymization
from tilavarauspalvelu.models.user.actions import ANONYMIZED_FIRST_NAME, ANONYMIZED_LAST_NAME
from utils.date_utils import local_datetime

from tests.factories import UserFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@freeze_time("2024-01-01")
def test_get_context__user_anonymization__en():
    with TranslationsFromPOFiles():
        context = get_context_for_user_anonymization(language="en")

    assert context == {
        "email_recipient_name": None,
        "title": "Your user account in the Varaamo service is expiring",
        "text_user_anonymization": (
            "Your user account in the Varaamo service will expire if you do not log in within two weeks. "
            "The information will be permanently deleted if your account expires."
        ),
        "text_login_to_prevent": "You can extend the validity of your user account by logging into the service at",
        "login_url": "https://fake.varaamo.hel.fi/en",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/en">https://fake.varaamo.hel.fi/en</a>',
        **BASE_TEMPLATE_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__user_anonymization__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_user_anonymization(language="fi")

    assert context == {
        "email_recipient_name": None,
        "title": "Käyttäjätilisi Varaamo-palveluun on vanhentumassa",
        "text_user_anonymization": (
            "Käyttäjätilisi Varaamo-palvelussa vanhenee, jos et kirjaudu sisään palveluun kahden viikon kuluessa. "
            "Tiedot poistetaan pysyvästi, jos tilisi vanhenee."
        ),
        "text_login_to_prevent": "Voit jatkaa käyttäjätilisi voimassaoloa kirjautumalla sisään palveluun osoitteessa",
        "login_url": "https://fake.varaamo.hel.fi",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi">https://fake.varaamo.hel.fi</a>',
        **BASE_TEMPLATE_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__user_anonymization__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_user_anonymization(language="sv")

    assert context == {
        "email_recipient_name": None,
        "title": "Ditt användarkonto i Varaamo-tjänsten håller på att gå ut",
        "text_user_anonymization": (
            "Ditt användarkonto på tjänsten Varaamo kommer att upphöra om du inte loggar in inom två veckor. "
            "Informationen kommer att raderas permanent om ditt konto upphör."
        ),
        "text_login_to_prevent": (
            "Du kan förlänga giltigheten för ditt användarkonto genom att logga in på tjänsten på"
        ),
        "login_url": "https://fake.varaamo.hel.fi/sv",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/sv">https://fake.varaamo.hel.fi/sv</a>',
        **BASE_TEMPLATE_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_user_anonymization__text():
    context = get_mock_data(email_type=EmailType.USER_ANONYMIZATION, language="en")
    text_content = render_text(email_type=EmailType.USER_ANONYMIZATION, context=context)

    message = (
        "Your user account in the Varaamo service will expire if you do not log in within two weeks. "
        "The information will be permanently deleted if your account expires."
    )

    assert text_content == cleandoc(
        f"""
        Hi,

        {message}

        You can extend the validity of your user account by logging into the service at:
        https://fake.varaamo.hel.fi/en

        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_user_anonymization__html():
    context = get_mock_data(email_type=EmailType.USER_ANONYMIZATION, language="en")
    html_content = render_html(email_type=EmailType.USER_ANONYMIZATION, context=context)
    text_content = html_email_to_text(html_content)

    message = (
        "Your user account in the Varaamo service will expire if you do not log in within two weeks. "
        "The information will be permanently deleted if your account expires."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        {message}

        You can extend the validity of your user account by logging into the service at:
        <https://fake.varaamo.hel.fi/en>

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
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your user account in the Varaamo service is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__no_email(outbox):
    UserFactory.create(
        # User has no email, so we can't notify them (but we should still anonymize)
        email="",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__logged_in_recently(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=1),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__going_to_be_old(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        # Logged in within `ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS`,
        # but after `ANONYMIZATION_NOTIFICATION_BEFORE_DAYS`
        # user will be considered inactive, so we need to send email now.
        last_login=local_datetime() - datetime.timedelta(days=6),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your user account in the Varaamo service is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__already_anonymized(outbox):
    UserFactory.create(
        first_name=ANONYMIZED_FIRST_NAME,
        last_name=ANONYMIZED_LAST_NAME,
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__multiple_languages(outbox):
    UserFactory.create(
        email="user1@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )
    UserFactory.create(
        email="user2@email.com",
        preferred_language=Language.FI.value,
        last_login=local_datetime() - datetime.timedelta(days=25),
    )

    with TranslationsFromPOFiles():
        EmailService.send_user_anonymization_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Käyttäjätilisi Varaamo-palveluun on vanhentumassa"
    assert sorted(outbox[0].bcc) == ["user2@email.com"]

    assert outbox[1].subject == "Your user account in the Varaamo service is expiring"
    assert sorted(outbox[1].bcc) == ["user1@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__email_already_sent(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        sent_email_about_anonymization=True,
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0
