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
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_permission_deactivation,
    get_context_for_user_anonymization,
)


@freeze_time("2024-01-01")
def test_get_context__permission_deactivation__en():
    with TranslationsFromPOFiles():
        context = get_context_for_permission_deactivation(language="en")

    assert context == {
        "email_recipient_name": None,
        "title": "Your staff access to Varaamo is expiring",
        "text_permission_deactivation": (
            "Your staff access to Varaamo will expire if you do not log in to the service within two weeks."
        ),
        "text_login_to_prevent": "Log in to the service at",
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
        "title": "Henkilökunnan käyttöoikeutesi Varaamoon on vanhentumassa",
        "text_permission_deactivation": (
            "Henkilökunnan käyttöoikeutesi Varaamoon vanhenee, "
            "jos et kirjaudu sisään palveluun kahden viikon kuluessa."
        ),
        "text_login_to_prevent": "Kirjaudu palveluun osoitteessa",
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
        "title": "Din personalåtkomst till Varaamo håller på att gå ut",
        "text_permission_deactivation": (
            "Din personalåtkomst till Varaamo kommer att upphöra om du inte loggar in på tjänsten inom två veckor."
        ),
        "text_login_to_prevent": "Logga in i tjänsten på",
        "login_url": "https://fake.varaamo.hel.fi/kasittely",
        "login_url_html": '<a href="https://fake.varaamo.hel.fi/kasittely">https://fake.varaamo.hel.fi/kasittely</a>',
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


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
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
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
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
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
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }
