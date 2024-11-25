# ruff: noqa: RUF001
from __future__ import annotations

from freezegun import freeze_time

from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
)

from tests.helpers import TranslationsFromPOFiles
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
)


@freeze_time("2024-01-01")
def test_get_context__application_handled__en():
    with TranslationsFromPOFiles():
        context = get_context_for_application_handled(language="en")

    assert context == {
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
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__application_handled__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_handled(language="fi")

    assert context == {
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
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__application_handled__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_handled(language="sv")

    assert context == {
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
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


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


@freeze_time("2024-01-01")
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
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
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
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
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
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }
