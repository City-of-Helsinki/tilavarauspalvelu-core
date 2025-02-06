# type: EmailType.RESERVATION_REJECTED

from __future__ import annotations

import datetime
from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_rejected
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01")
def test_get_context__reservation_rejected__en(email_reservation):
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_rejected(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="[HYLKÄYKSEN SYY]",
            reservation_id=email_reservation.id,
            instructions_cancelled="[PERUUTETUN VARAUKSEN OHJEET]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "booking_number_label": "Booking number",
        "reservation_id": f"{email_reservation.id}",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        "text_reservation_rejected": "Unfortunately your booking cannot be confirmed",
        "instructions_cancelled_html": "[PERUUTETUN VARAUKSEN OHJEET]",
        "instructions_cancelled_text": "[PERUUTETUN VARAUKSEN OHJEET]",
        "title": "Unfortunately your booking cannot be confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_reservation_rejected(
            reservation=email_reservation,
            language="en",
        )


@freeze_time("2024-01-01")
def test_get_context__reservation_rejected__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_rejected(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="Tässä on hylkäyksen syy",
            reservation_id=12,
            instructions_cancelled="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "booking_number_label": "Varausnumero",
        "reservation_id": "12",
        "rejection_reason": "Tässä on hylkäyksen syy",
        "text_reservation_rejected": "Valitettavasti varaustasi ei voida vahvistaa",
        "instructions_cancelled_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_cancelled_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Valitettavasti varaustasi ei voida vahvistaa",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_rejected__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_rejected(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="Här är orsaken till avslagningen",
            reservation_id=12,
            instructions_cancelled="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "booking_number_label": "Bokningsnummer",
        "reservation_id": "12",
        "rejection_reason": "Här är orsaken till avslagningen",
        "text_reservation_rejected": "Tyvärr kan vi inte bekräfta din bokning",
        "instructions_cancelled_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_cancelled_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Tyvärr kan vi inte bekräfta din bokning",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_rejected__text():
    context = get_mock_data(email_type=EmailType.RESERVATION_REJECTED, language="en")
    text_content = render_text(email_type=EmailType.RESERVATION_REJECTED, context=context)

    assert text_content == cleandoc(
        """
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Unfortunately your booking cannot be confirmed.
        Reason: [HYLKÄYKSEN SYY]

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]

        From: 1.1.2024 at 12:00
        To: 2.1.2024 at 15:00

        Booking number: 1234

        Additional information:
        [PERUUTETUN VARAUKSEN OHJEET]

        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_rejected__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REJECTED, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_REJECTED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Unfortunately your booking cannot be confirmed.

        Reason: [HYLKÄYKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Booking number: 1234

        ## Additional information

        [PERUUTETUN VARAUKSEN OHJEET]

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
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_rejected_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_rejected_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="",
        user__email="",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation rejected email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_rejected_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_rejected_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_rejected_email__no_normal_reservation(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.BEHALF,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0
