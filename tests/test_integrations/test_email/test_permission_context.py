# ruff: noqa: RUF001

from freezegun import freeze_time

from tests.helpers import TranslationsFromPOFiles
from tests.test_integrations.test_email.helpers import (
    AUTOMATIC_REPLY_CONTEXT_EN,
    AUTOMATIC_REPLY_CONTEXT_FI,
    AUTOMATIC_REPLY_CONTEXT_SV,
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    CLOSING_CONTEXT_EN,
    CLOSING_CONTEXT_FI,
    CLOSING_CONTEXT_SV,
)
from tilavarauspalvelu.integrations.email.template_context import get_context_for_permission_deactivation


@freeze_time("2024-01-01")
def test_get_context__permission_deactivation__en():
    with TranslationsFromPOFiles():
        context = get_context_for_permission_deactivation(language="en")

    assert context == {
        "email_recipient_name": None,
        "title": "Your permissions in Varaamo are going to be deactivated",
        "text_permission_deactivation": (
            "Your account in Varaamo has staff permissions. "
            "Since you haven't logged in for a while, these permissions are going to be revoked."
        ),
        "text_login_to_prevent": "You can login to Varaamo here to prevent this from happening",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__permission_deactivation__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_permission_deactivation(language="fi")

    assert context == {
        "email_recipient_name": None,
        "title": "Varaamo-tunnuksesi käyttöoikeudet ovat vanhenemassa",
        "text_permission_deactivation": (
            "Sähköpostiosoitteellasi on Varaamossa käyttäjätunnus, jolle on myönnetty henkilökunnan käyttöoikeuksia. "
            "Koska tunnuksella ei ole kirjauduttu lähiaikoina, tullaan nämä oikeudet poistamaan."
        ),
        "text_login_to_prevent": "Voit kirjautua palveluun osoitteessa",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__permission_deactivation__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_permission_deactivation(language="sv")

    assert context == {
        "email_recipient_name": None,
        "title": "Dina behörigheter i Varaamo kommer att avaktiveras",
        "text_permission_deactivation": (
            "Ditt konto i Varaamo har personalbehörighet. "
            "Eftersom du inte har loggat in på ett tag kommer dessa behörigheter att återkallas."
        ),
        "text_login_to_prevent": "Du kan logga in på Varaamo här för att förhindra att detta händer",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }
