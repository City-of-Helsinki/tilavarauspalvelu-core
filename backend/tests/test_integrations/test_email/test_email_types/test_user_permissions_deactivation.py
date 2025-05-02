# type: EmailType.USER_PERMISSIONS_DEACTIVATION

from __future__ import annotations

import datetime
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import Language
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_user_permissions_deactivation
from tilavarauspalvelu.integrations.email.typing import EmailType
from utils.date_utils import local_datetime

from tests.factories import UnitFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles
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
        "title": "Your staff access to Varaamo is expiring",
        "text_permission_deactivation": (
            "Your staff access to Varaamo will expire if you do not log in to the service within two weeks."
        ),
        "text_login_to_prevent": "Log in to the service at",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_EN,
    },
    "fi": {
        "email_recipient_name": None,
        "title": "Henkilökunnan käyttöoikeutesi Varaamoon on vanhentumassa",
        "text_permission_deactivation": (
            "Henkilökunnan käyttöoikeutesi Varaamoon vanhenee, jos et kirjaudu sisään palveluun kahden viikon kuluessa."
        ),
        "text_login_to_prevent": "Kirjaudu palveluun osoitteessa",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_FI,
    },
    "sv": {
        "email_recipient_name": None,
        "title": "Din personalåtkomst till Varaamo håller på att gå ut",
        "text_permission_deactivation": (
            "Din personalåtkomst till Varaamo kommer att upphöra om du inte loggar in på tjänsten inom två veckor."
        ),
        "text_login_to_prevent": "Logga in i tjänsten på",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_SV,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_user_permissions_deactivation__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_user_permissions_deactivation(language=lang)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_user_permissions_deactivation__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.USER_PERMISSIONS_DEACTIVATION, language=lang)

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_user_permissions_deactivation__render__text():
    context = get_mock_data(email_type=EmailType.USER_PERMISSIONS_DEACTIVATION, language="en")
    text_content = render_text(email_type=EmailType.USER_PERMISSIONS_DEACTIVATION, context=context)

    assert text_content == cleandoc(
        f"""
        Hi,

        Your staff access to Varaamo will expire if you do not log in to the service within two weeks.

        Log in to the service at:
        https://fake.varaamo.hel.fi/kasittely

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_user_permissions_deactivation__render__html():
    context = get_mock_data(email_type=EmailType.USER_PERMISSIONS_DEACTIVATION, language="en")
    html_content = render_html(email_type=EmailType.USER_PERMISSIONS_DEACTIVATION, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi,**

        Your staff access to Varaamo will expire if you do not log in to the service within two weeks.

        Log in to the service at:
        <https://fake.varaamo.hel.fi/kasittely>

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__logged_in_recently(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=1),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__permissions_going_to_expire(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        # Logged in within `PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS`, but after `PERMISSION_NOTIFICATION_BEFORE_DAYS`
        # permissions are going to be expired, so we need to send email now.
        last_login=local_datetime() - datetime.timedelta(days=6),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__no_recipients(outbox):
    UserFactory.create_superuser(
        # User has no email, so we can't notify them (but we should still deactivate the permissions)
        email="",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__general_admin(outbox):
    UserFactory.create_with_general_role(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__general_admin__role_inactive(outbox):
    UserFactory.create_with_general_role(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        general_roles__role_active=False,
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__unit_admin(outbox):
    UserFactory.create_with_unit_role(
        units=[UnitFactory.create()],
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__unit_admin__role_inactive(outbox):
    UserFactory.create_with_unit_role(
        units=[UnitFactory.create()],
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        unit_roles__role_active=False,
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__multiple_languages(outbox):
    UserFactory.create_superuser(
        email="user1@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )
    UserFactory.create_superuser(
        email="user2@email.com",
        preferred_language=Language.FI.value,
        last_login=local_datetime() - datetime.timedelta(days=25),
    )

    with TranslationsFromPOFiles():
        EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Henkilökunnan käyttöoikeutesi Varaamoon on vanhentumassa"
    assert sorted(outbox[0].bcc) == ["user2@email.com"]

    assert outbox[1].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[1].bcc) == ["user1@email.com"]


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__no_permissions(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 0


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_user_permissions_deactivation__send_email__email_already_sent(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        sent_email_about_deactivating_permissions=True,
    )

    EmailService.send_user_permissions_deactivation_emails()

    assert len(outbox) == 0
