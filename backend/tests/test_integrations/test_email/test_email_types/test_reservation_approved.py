# type: EmailType.RESERVATION_APPROVED

from __future__ import annotations

import datetime
from decimal import Decimal
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_approved
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraReservationResponse
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
        "title": "Your booking is confirmed",
        "text_reservation_approved": "Your booking is now confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Varauksesi on vahvistettu",
        "text_reservation_approved": "Varauksesi on nyt vahvistettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din bokning är bekräftad",
        "text_reservation_approved": "Din bokning har bekräftats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}
LANGUAGE_DISCOUNT_CONTEXT = {
    "en": {"text_reservation_approved": "Your booking has been confirmed with the following discount:"},
    "fi": {"text_reservation_approved": "Varauksesi on hyväksytty, ja varaukseen on myönnetty seuraava alennus:"},
    "sv": {"text_reservation_approved": "Din bokning har bekräftats med följande rabatt:"},
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context__reservation_approved(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(**get_mock_params(language=lang)) == expected
        assert get_mock_data(email_type=EmailType.RESERVATION_APPROVED, language=lang) == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context__reservation_approved__discount(lang: Lang):
    expected = {**LANGUAGE_CONTEXT[lang], **LANGUAGE_DISCOUNT_CONTEXT[lang]}

    params = {
        "price": Decimal("12.30"),
        "non_subsidised_price": Decimal("14.30"),
    }
    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(**get_mock_params(**params, language=lang)) == expected
        assert get_mock_data(email_type=EmailType.RESERVATION_APPROVED, **params, language=lang) == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__instance(email_reservation):
    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
        "instructions_confirmed_html": '<p>[HYVÄKSYTYN VARAUKSEN OHJEET] <a href="https://foo.bar">LINK</a></p>',
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET] LINK <https://foo.bar>",
    }

    params = {
        "reservation_id": email_reservation.id,
        "instructions_confirmed": '<p>[HYVÄKSYTYN VARAUKSEN OHJEET] <a href="https://foo.bar">LINK</a></p>',
    }
    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(**get_mock_params(**params, language="en")) == expected

    email_reservation.reservation_units.update(
        reservation_confirmed_instructions_en='<p>[HYVÄKSYTYN VARAUKSEN OHJEET] <a href="https://foo.bar">LINK</a></p>'
    )
    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(reservation=email_reservation, language="en") == expected


@patch_method(
    PindoraClient.get_reservation,
    return_value=PindoraReservationResponse(
        access_code="123456",
        access_code_is_active=True,
        begin=datetime.datetime(2024, 1, 1, 11),
        end=datetime.datetime(2024, 1, 1, 15),
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
    ),
)
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__access_code(email_reservation):
    expected = {
        **LANGUAGE_CONTEXT["en"],
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
    }

    params = {
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        "reservation_id": email_reservation.id,
    }
    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(**get_mock_params(**params, language="en")) == expected

    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()
    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(reservation=email_reservation, language="en") == expected


@patch_method(
    PindoraClient.get_reservation,
    return_value=PindoraReservationResponse(
        access_code="123456",
        access_code_is_active=False,
        begin=datetime.datetime(2024, 1, 1, 11),
        end=datetime.datetime(2024, 1, 1, 15),
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
    ),
)
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__access_code__inactive(email_reservation):
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
        assert get_context_for_reservation_approved(**get_mock_params(**params, language="en")) == expected

    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()
    with TranslationsFromPOFiles():
        assert get_context_for_reservation_approved(reservation=email_reservation, language="en") == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
    )
    text_content = render_text(email_type=EmailType.RESERVATION_APPROVED, context=context)

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking is now confirmed.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        Additional information about your booking:
        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__discount__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("15.30"),
    )
    text_content = render_text(email_type=EmailType.RESERVATION_APPROVED, context=context)

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking has been confirmed with the following discount:

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        Additional information about your booking:
        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__access_code__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        access_code_is_used=True,
    )
    text_content = render_text(email_type=EmailType.RESERVATION_APPROVED, context=context)

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking is now confirmed.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        You can access the space with the door code.
        Door code: 123456
        Validity period of the door code: 11:00-15:00

        Additional information about your booking:
        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__access_code_error__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        access_code_is_used=True,
        access_code="",
        access_code_validity_period="",
    )
    text_content = render_text(email_type=EmailType.RESERVATION_APPROVED, context=context)

    access_code_error = (
        "You can see the door code on the https://fake.varaamo.hel.fi/en/reservations: 'My bookings' page at Varaamo. "
        "If the code is not visible in your booking details, please contact "
        "https://fake.varaamo.hel.fi/feedback?lang=en: Varaamo customer service."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking is now confirmed.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        {access_code_error}

        Additional information about your booking:
        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking is now confirmed.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_HTML_EN}
        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__discount__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("15.30"),
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been confirmed with the following discount:

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_HTML_EN}
        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__access_code__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        access_code_is_used=True,
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking is now confirmed.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234
        You can access the space with the door code.
        Door code: 123456
        Validity period of the door code: 11:00-15:00

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_HTML_EN}
        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__access_code_error__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        access_code_is_used=True,
        access_code="",
        access_code_validity_period="",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
    text_content = html_email_to_text(html_content)

    access_code_text = (
        "You can see the door code on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations) at "
        "Varaamo. If the code is not visible in your booking details, "
        "please contact [Varaamo customer service](https://fake.varaamo.hel.fi/feedback?lang=en)."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking is now confirmed.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234
        {access_code_text}

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
def test_email_service__send_reservation_approved_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking is confirmed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]

    assert len(outbox[0].attachments) == 1
    assert outbox[0].attachments[0][0] == "reservation_calendar.ics"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_reservation_approved_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_approved_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="",
        user__email="",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation approved email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_approved_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 20, 0),
        end=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0
