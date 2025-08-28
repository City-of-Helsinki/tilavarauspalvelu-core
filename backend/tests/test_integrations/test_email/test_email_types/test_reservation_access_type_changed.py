# type: EmailType.RESERVATION_ACCESS_TYPE_CHANGED

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
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_access_type_changed
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

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

CONTEXT_ACCESS_CODE = {
    "en": {
        "text_reservation_modified": (
            "Access to the space will change starting from 1.1.2024. "
            "You can access the space with a door code, which you can find on the "
            "'My bookings' (https://fake.varaamo.hel.fi/en/reservations) page."
        ),
        "text_reservation_modified_html": (
            "Access to the space will change starting from 1.1.2024. "
            "You can access the space with a door code, which you can find on the "
            '<a href="https://fake.varaamo.hel.fi/en/reservations">'
            "'My bookings'</a> page."
        ),
    },
    "fi": {
        "text_reservation_modified": (
            "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Pääset tilaan ovikoodilla, jonka löydät "
            "'Omat Varaukset' (https://fake.varaamo.hel.fi/reservations) -sivulta."
        ),
        "text_reservation_modified_html": (
            "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Pääset tilaan ovikoodilla, jonka löydät "
            '<a href="https://fake.varaamo.hel.fi/reservations">'
            "'Omat Varaukset'</a> -sivulta."
        ),
    },
    "sv": {
        "text_reservation_modified": (
            "Tillträde till lokalen ändras från och med 1.1.2024. "
            "Du får tillträde med en dörrkod, som du hittar på sidan "
            "'Mina bokningar' (https://fake.varaamo.hel.fi/sv/reservations)."
        ),
        "text_reservation_modified_html": (
            "Tillträde till lokalen ändras från och med 1.1.2024. "
            "Du får tillträde med en dörrkod, som du hittar på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/reservations">'
            "'Mina bokningar'</a>."
        ),
    },
}

CONTEXT_OPENED_BY_STAFF = {
    "en": {
        "text_reservation_modified": (
            "Access to the space will change starting from 1.1.2024. The staff will open the door to the space."
        ),
        "text_reservation_modified_html": (
            "Access to the space will change starting from 1.1.2024. The staff will open the door to the space."
        ),
    },
    "fi": {
        "text_reservation_modified": "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Henkilökunta avaa tilan oven.",
        "text_reservation_modified_html": "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Henkilökunta avaa tilan oven.",
    },
    "sv": {
        "text_reservation_modified": (
            "Tillträde till lokalen ändras från och med 1.1.2024. Personalen öppnar dörren till lokalen."
        ),
        "text_reservation_modified_html": (
            "Tillträde till lokalen ändras från och med 1.1.2024. Personalen öppnar dörren till lokalen."
        ),
    },
}

CONTEXT_PHYSICAL_KEY = {
    "en": {
        "text_reservation_modified": (
            "Access to the space will change starting from 1.1.2024. "
            "Please arrange the collection of the key with the staff."
        ),
        "text_reservation_modified_html": (
            "Access to the space will change starting from 1.1.2024. "
            "Please arrange the collection of the key with the staff."
        ),
    },
    "fi": {
        "text_reservation_modified": (
            "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Sovi henkilökunnan kanssa avaimen noudosta."
        ),
        "text_reservation_modified_html": (
            "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Sovi henkilökunnan kanssa avaimen noudosta."
        ),
    },
    "sv": {
        "text_reservation_modified": (
            "Tillträde till lokalen ändras från och med 1.1.2024. Kom överens med personalen om att hämta nyckeln."
        ),
        "text_reservation_modified_html": (
            "Tillträde till lokalen ändras från och med 1.1.2024. Kom överens med personalen om att hämta nyckeln."
        ),
    },
}

CONTEXT_UNRESTRICTED = {
    "en": {
        "text_reservation_modified": (
            "Access to the space will change starting from 1.1.2024. You will have a direct access to the space."
        ),
        "text_reservation_modified_html": (
            "Access to the space will change starting from 1.1.2024. You will have a direct access to the space."
        ),
    },
    "fi": {
        "text_reservation_modified": "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Tilaan on suora pääsy.",
        "text_reservation_modified_html": "Sisäänpääsy tilaan muuttuu 1.1.2024 alkaen. Tilaan on suora pääsy.",
    },
    "sv": {
        "text_reservation_modified": (
            "Tillträde till lokalen ändras från och med 1.1.2024. Du har direkt tillträde till lokalen."
        ),
        "text_reservation_modified_html": (
            "Tillträde till lokalen ändras från och med 1.1.2024. Du har direkt tillträde till lokalen."
        ),
    },
}

LANGUAGE_CONTEXT = {
    "en": {
        "title": "Access to the space has changed",
        **CONTEXT_ACCESS_CODE["en"],
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
        **CONTEXT_ACCESS_CODE["fi"],
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
        **CONTEXT_ACCESS_CODE["sv"],
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
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        params = get_mock_params(access_code_is_used=True, language=lang)
        context = get_context_for_reservation_access_type_changed(**params)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_mock_data(
            email_type=EmailType.RESERVATION_ACCESS_TYPE_CHANGED,
            access_code_is_used=True,
            language=lang,
        )

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info())
@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__access_code(email_reservation):
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
        context = get_context_for_reservation_access_type_changed(**params)

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info(access_code_is_active=False))
@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__access_code__inactive(email_reservation):
    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
        "access_code_is_used": True,
    }

    with TranslationsFromPOFiles():
        params = get_mock_params(
            access_code_is_used=True,
            access_code="",
            access_code_validity_period="",
            reservation_id=email_reservation.id,
            language="en",
        )
        context = get_context_for_reservation_access_type_changed(**params)

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info())
@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__instance__access_code(email_reservation):
    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_access_type_changed(reservation=email_reservation, language="en")

    assert context == expected


@patch_method(PindoraService.get_access_code, return_value=pindora_reservation_info(access_code_is_active=False))
@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__instance__access_code__inactive(email_reservation):
    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
        "access_code_is_used": True,
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_access_type_changed(reservation=email_reservation, language="en")

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__opened_by_staff(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        **CONTEXT_OPENED_BY_STAFF[lang],
    }

    with TranslationsFromPOFiles():
        params = get_mock_params(
            **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
            access_type=AccessType.OPENED_BY_STAFF.value,
            language=lang,
        )
        context = get_context_for_reservation_access_type_changed(**params)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__physical_key(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        **CONTEXT_PHYSICAL_KEY[lang],
    }

    with TranslationsFromPOFiles():
        params = get_mock_params(
            **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
            access_type=AccessType.PHYSICAL_KEY.value,
            language=lang,
        )
        context = get_context_for_reservation_access_type_changed(**params)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__get_context__unrestricted(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
        **CONTEXT_UNRESTRICTED[lang],
    }

    with TranslationsFromPOFiles():
        params = get_mock_params(
            **KEYLESS_ENTRY_ACCESS_CODE_NOT_USED_CONTEXT,
            access_type=AccessType.UNRESTRICTED.value,
            language=lang,
        )
        context = get_context_for_reservation_access_type_changed(**params)

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__render__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_ACCESS_TYPE_CHANGED,
        access_code_is_used=True,
        language="en",
    )
    text_content = render_text(email_type=EmailType.RESERVATION_ACCESS_TYPE_CHANGED, context=context)

    body = (
        "Access to the space will change starting from 1.1.2024. You can access the "
        "space with a door code, which you can find on the 'My bookings' "
        "(https://fake.varaamo.hel.fi/en/reservations) page."
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


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__render__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_ACCESS_TYPE_CHANGED,
        access_code_is_used=True,
        language="en",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_ACCESS_TYPE_CHANGED, context=context)
    text_content = html_email_to_text(html_content)

    body = (
        "Access to the space will change starting from 1.1.2024. You can access the "
        "space with a door code, which you can find on the "
        "['My bookings'](https://fake.varaamo.hel.fi/en/reservations) page."
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
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_access_type_changed__send_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.ACCESS_CODE,
        reservation_unit__access_types__access_type=AccessType.UNRESTRICTED,
        reservation_unit__access_types__begin_date=datetime.date(2024, 1, 1),
    )

    EmailService.send_reservation_access_type_changed_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Access to the space has changed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time(local_datetime(2024, 1, 1, 12))
@patch_method(SentryLogger.log_message)
def test_reservation_access_type_changed__send_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.ACCESS_CODE,
        reservation_unit__access_types__access_type=AccessType.UNRESTRICTED,
        reservation_unit__access_types__begin_date=datetime.date(2024, 1, 1),
    )

    EmailService.send_reservation_access_type_changed_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for the 'reservation access type changed' email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_reservation_access_type_changed__send_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
        access_type=AccessType.ACCESS_CODE,
        reservation_unit__access_types__access_type=AccessType.UNRESTRICTED,
        reservation_unit__access_types__begin_date=datetime.date(2024, 1, 1),
    )

    EmailService.send_reservation_access_type_changed_email(reservation)

    assert len(outbox) == 0
