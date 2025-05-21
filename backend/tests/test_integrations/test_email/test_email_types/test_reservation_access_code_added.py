# type: EmailType.RESERVATION_ACCESS_CODE_ADDED

from __future__ import annotations

import datetime
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_access_code_added
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
    KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
    KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
    KEYLESS_ENTRY_CONTEXT_EN,
    KEYLESS_ENTRY_CONTEXT_FI,
    KEYLESS_ENTRY_CONTEXT_SV,
    MANAGE_RESERVATIONS_LINK_HTML_EN,
    MANAGE_RESERVATIONS_LINK_TEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
    RESERVATION_MANAGE_LINK_CONTEXT_EN,
    RESERVATION_MANAGE_LINK_CONTEXT_FI,
    RESERVATION_MANAGE_LINK_CONTEXT_SV,
    RESERVATION_PRICE_INFO_CONTEXT_EN,
    RESERVATION_PRICE_INFO_CONTEXT_FI,
    RESERVATION_PRICE_INFO_CONTEXT_SV,
    html_email_to_text,
    pindora_reservation_info,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
    "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Access to the space has changed",
        "text_reservation_modified": (
            "Access to the space has changed. "
            "You can find the door code in this message and at 'My bookings' "
            "(https://fake.varaamo.hel.fi/en/reservations) page at Varaamo."
        ),
        "text_reservation_modified_html": (
            "Access to the space has changed. "
            "You can find the door code in this message and at "
            '<a href="https://fake.varaamo.hel.fi/en/reservations">'
            "'My bookings'</a> page at Varaamo."
        ),
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Sisäänpääsy tilaan on muuttunut",
        "text_reservation_modified": (
            "Sisäänpääsy tilaan on muuttunut. "
            "Löydät ovikoodin tästä viestistä sekä 'Omat Varaukset' "
            "(https://fake.varaamo.hel.fi/reservations) -sivulta Varaamossa."
        ),
        "text_reservation_modified_html": (
            "Sisäänpääsy tilaan on muuttunut. "
            "Löydät ovikoodin tästä viestistä sekä "
            '<a href="https://fake.varaamo.hel.fi/reservations">'
            "'Omat Varaukset'</a> -sivulta Varaamossa."
        ),
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Tillgången till utrymmet har ändrats",
        "text_reservation_modified": (
            "Tillgången till utrymmet har ändrats. "
            "Du hittar dörrkoden i detta meddelande och på sidan 'Mina bokningar' "
            "(https://fake.varaamo.hel.fi/sv/reservations) på Varaamo."
        ),
        "text_reservation_modified_html": (
            "Tillgången till utrymmet har ändrats. "
            "Du hittar dörrkoden i detta meddelande och på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/reservations">'
            "'Mina bokningar'</a> på Varaamo."
        ),
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_access_code_added__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        params = get_mock_params(access_code_is_used=True, language=lang)
        context = get_context_for_reservation_access_code_added(**params)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_access_code_added__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_mock_data(
            email_type=EmailType.RESERVATION_ACCESS_CODE_ADDED,
            access_code_is_used=True,
            language=lang,
        )

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info())
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__get_context__access_code(email_reservation):
    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
    }

    with TranslationsFromPOFiles():
        params = get_mock_params(
            **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
            reservation_id=email_reservation.id,
            language="en",
        )
        context = get_context_for_reservation_access_code_added(**params)

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info(access_code_is_active=False))
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__get_context__access_code__inactive(email_reservation):
    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
        "access_code_is_used": True,
    }

    params = {
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        "reservation_id": email_reservation.id,
        "access_code_is_used": True,
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_access_code_added(**get_mock_params(**params, language="en"))

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info())
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__get_context__instance__access_code(email_reservation):
    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_access_code_added(reservation=email_reservation, language="en")

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info(access_code_is_active=False))
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__get_context__instance__access_code__inactive(email_reservation):
    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
        "access_code_is_used": True,
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_access_code_added(reservation=email_reservation, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__render__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_ACCESS_CODE_ADDED,
        access_code_is_used=True,
        language="en",
    )
    text_content = render_text(email_type=EmailType.RESERVATION_ACCESS_CODE_ADDED, context=context)

    body = (
        "Access to the space has changed. "
        "You can find the door code in this message and at 'My bookings' "
        "(https://fake.varaamo.hel.fi/en/reservations) page at Varaamo."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        {body}

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        Door code: 123456
        Validity period of the door code: 11:00-15:00

        Additional information about your booking:
        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__render__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_ACCESS_CODE_ADDED,
        access_code_is_used=True,
        language="en",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_ACCESS_CODE_ADDED, context=context)
    text_content = html_email_to_text(html_content)

    body = (
        "Access to the space has changed. You can find the door code in this message "
        "and at ['My bookings'](https://fake.varaamo.hel.fi/en/reservations) page at Varaamo."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        {body}

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234
        Door code: 123456
        Validity period of the door code: 11:00-15:00

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_HTML_EN}
        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__send_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.ACCESS_CODE,
    )

    EmailService.send_reservation_access_code_added_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Access to the space has changed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_access_code_added__send_email__wrong_access_type(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.UNRESTRICTED,
    )

    EmailService.send_reservation_access_code_added_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_reservation_access_code_added__send_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        reservee_email="",
        user__email="",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.ACCESS_CODE,
    )

    EmailService.send_reservation_access_code_added_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for the 'reservation access code added' email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_reservation_access_code_added__send_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.ACCESS_CODE,
    )

    EmailService.send_reservation_access_code_added_email(reservation)

    assert len(outbox) == 0
