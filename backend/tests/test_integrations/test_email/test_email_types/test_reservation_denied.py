# type: EmailType.RESERVATION_DENIED

from __future__ import annotations

import datetime
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_denied
from tilavarauspalvelu.integrations.email.typing import EmailType
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
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    "instructions_cancelled_html": "[PERUUTETUN VARAUKSEN OHJEET]",
    "instructions_cancelled_text": "[PERUUTETUN VARAUKSEN OHJEET]",
    "rejection_reason": "[HYLKÄYKSEN SYY]",
    "reservation_id": "1234",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Unfortunately your booking cannot be confirmed",
        "text_reservation_rejected": "Unfortunately your booking cannot be confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Valitettavasti varaustasi ei voida vahvistaa",
        "text_reservation_rejected": "Valitettavasti varaustasi ei voida vahvistaa",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Tyvärr kan vi inte bekräfta din bokning",
        "text_reservation_rejected": "Tyvärr kan vi inte bekräfta din bokning",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_denied__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_denied(**get_mock_params(language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_denied__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        mock_context = get_mock_data(email_type=EmailType.RESERVATION_DENIED, language=lang)

    assert mock_context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_denied__get_context__instance(email_reservation):
    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_denied(reservation=email_reservation, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_denied__render__text():
    context = get_mock_data(email_type=EmailType.RESERVATION_DENIED, language="en")
    text_content = render_text(email_type=EmailType.RESERVATION_DENIED, context=context)

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Unfortunately your booking cannot be confirmed.
        Reason: [HYLKÄYKSEN SYY]

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Booking number: 1234

        Additional information:
        [PERUUTETUN VARAUKSEN OHJEET]

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_denied__render__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_DENIED, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_DENIED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Unfortunately your booking cannot be confirmed.

        Reason: [HYLKÄYKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Booking number: 1234

        ## Additional information

        [PERUUTETUN VARAUKSEN OHJEET]

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_denied__send_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_denied_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_reservation_denied__send_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_denied_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for the 'reservation denied' email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_denied__send_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_denied_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_reservation_denied__send_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_denied_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_reservation_denied__send_email__no_normal_reservation(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.BEHALF,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begins_at=datetime.datetime(2024, 1, 1, 20, 0),
        ends_at=datetime.datetime(2024, 1, 1, 22, 0),
    )

    EmailService.send_reservation_denied_email(reservation)

    assert len(outbox) == 0
