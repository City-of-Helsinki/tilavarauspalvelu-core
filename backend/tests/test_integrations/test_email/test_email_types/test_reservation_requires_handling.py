# type: EmailType.RESERVATION_REQUIRES_HANDLING

from __future__ import annotations

import datetime
from decimal import Decimal
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_requires_handling
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import ReservationUnitPricing

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
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
    "instructions_pending_html": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
    "instructions_pending_text": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Your booking is waiting for processing",
        "text_reservation_requires_handling": "You have made a new booking request",
        "text_pending_notification": (
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request."
        ),
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Varauksesi odottaa käsittelyä",
        "text_reservation_requires_handling": "Olet tehnyt alustavan varauksen",
        "text_pending_notification": (
            "Saat varausvahvistuksen sähköpostitse, kun varauksesi on käsitelty. "
            "Otamme sinuun yhteyttä, jos tarvitsemme lisätietoja varauspyyntöösi liittyen."
        ),
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din bokning väntar på att behandlas",
        "text_reservation_requires_handling": "Du har gjort en ny bokningsförfrågan",
        "text_pending_notification": (
            "Du kommer att få en bekräftelse via e-post när din bokning har behandlats. "
            "Vi kommer att kontakta dig om ytterligare information behövs angående din bokningsförfrågan."
        ),
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_requires_handling__get_context__subsidised(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        "price_can_be_subsidised": True,
        "subsidised_price": Decimal("10.00"),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(**get_mock_params(language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_requires_handling__get_context__not_subsidised(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        "price_can_be_subsidised": False,
        "price": Decimal("12.30"),
        "subsidised_price": Decimal("12.30"),
    }

    params = {
        "price": Decimal("12.30"),
        "subsidised_price": Decimal("12.30"),
    }
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(**get_mock_params(**params, language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_requires_handling__get_context__get_mock_data__subsidised(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        "price_can_be_subsidised": True,
        "subsidised_price": Decimal("10.00"),
    }

    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, language=lang)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_requires_handling__get_context__get_mock_data__not_subsidised(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        "price_can_be_subsidised": False,
        "price": Decimal("12.30"),
        "subsidised_price": Decimal("12.30"),
    }

    params = {
        "price": Decimal("12.30"),
        "subsidised_price": Decimal("12.30"),
    }
    with TranslationsFromPOFiles():
        mock_context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, **params, language=lang)

    assert mock_context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__get_context__instance__subsidised(email_reservation):
    email_reservation.applying_for_free_of_charge = True
    email_reservation.save()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
        "price_can_be_subsidised": True,
        "price": Decimal("12.30"),
        "subsidised_price": Decimal("10.00"),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(reservation=email_reservation, language="en")

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__get_context__instance__not_subsidised(email_reservation):
    email_reservation.applying_for_free_of_charge = True
    email_reservation.save()

    ReservationUnitPricing.objects.update(
        lowest_price=Decimal("12.30"),
        highest_price=Decimal("12.30"),
    )

    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
        "price_can_be_subsidised": False,
        "price": Decimal("12.30"),
        "subsidised_price": Decimal("12.30"),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(reservation=email_reservation, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__render__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_REQUIRES_HANDLING,
        language="en",
        price=Decimal("12.30"),
        subsidised_price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
    )
    text_content = render_text(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        You have made a new booking request.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        Additional information about your booking:
        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__render__text__subsidised():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, language="en")
    text_content = render_text(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        You have made a new booking request.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 10,00 - 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        Additional information about your booking:
        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_TEXT_EN}

        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__render__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_REQUIRES_HANDLING,
        language="en",
        price=Decimal("12.30"),
        subsidised_price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
    )
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking request.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        ## Additional information about your booking

        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_HTML_EN}
        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__render__html__subsidised():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking request.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **10,00 - 12,30€** (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        ## Additional information about your booking

        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

        {MANAGE_RESERVATIONS_LINK_HTML_EN}
        Thank you for choosing Varaamo!
        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__send_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking is waiting for processing"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_handling__send_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_reservation_requires_handling__send_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="",
        user__email="",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for the 'reservation requires handling' email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_reservation_requires_handling__send_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0
