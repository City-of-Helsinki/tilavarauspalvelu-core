# type: EmailType.RESERVATION_CANCELLED

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationCancelReasonChoice, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_cancelled
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

from tests.factories import PaymentOrderFactory, ReservationFactory
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
    "instructions_cancelled_html": "[PERUUTETUN VARAUKSEN OHJEET]",
    "instructions_cancelled_text": "[PERUUTETUN VARAUKSEN OHJEET]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Your booking has been cancelled",
        "cancel_reason": "My plans have changed",
        "handled_payment_due_by": "1.1.2024 11:00",
        "handled_payment_due_by_label": "Deadline",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Varauksesi on peruttu",
        "cancel_reason": "Suunnitelmiini tuli muutos",
        "handled_payment_due_by": "1.1.2024 11:00",
        "handled_payment_due_by_label": "Määräaika",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din bokning har avbokats",
        "cancel_reason": "Mina planer har ändrats",
        "handled_payment_due_by": "1.1.2024 11:00",
        "handled_payment_due_by_label": "Tidsfrist",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_cancelled__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_cancelled(**get_mock_params(language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_cancelled__get_context__mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        mock_context = get_mock_data(email_type=EmailType.RESERVATION_CANCELLED, language=lang)

    assert mock_context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_cancelled__get_context__instance(email_reservation):
    email_reservation.cancel_reason = ReservationCancelReasonChoice.CHANGE_OF_PLANS
    email_reservation.save()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
        "handled_payment_due_by": None,
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_cancelled(reservation=email_reservation, language="en")

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_cancelled__get_context__instance__handled_payment(email_reservation):
    email_reservation.cancel_reason = ReservationCancelReasonChoice.NOT_PAID
    email_reservation.save()

    PaymentOrderFactory.create(
        reservation=email_reservation,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 0),
    )

    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
        "cancel_reason": (
            "The booking was not paid for or invoice was not selected as the payment method by the deadline."
        ),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_cancelled(reservation=email_reservation, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_cancelled__render__text():
    context = get_mock_data(email_type=EmailType.RESERVATION_CANCELLED, language="en")
    context["handled_payment_due_by"] = None
    text_content = render_text(email_type=EmailType.RESERVATION_CANCELLED, context=context)

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking has been cancelled.
        Your reason for cancellation: My plans have changed

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        Additional information about cancellation:
        [PERUUTETUN VARAUKSEN OHJEET]

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_cancelled__render__text__handled_payment():
    context = get_mock_data(email_type=EmailType.RESERVATION_CANCELLED, language="en")
    context["handled_payment_due_by"] = "1.1.2024 11:00"
    context["cancel_reason"] = str(ReservationCancelReasonChoice.NOT_PAID.label)

    text_content = render_text(email_type=EmailType.RESERVATION_CANCELLED, context=context)

    reason = "The booking was not paid for or invoice was not selected as the payment method by the deadline."

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking has been cancelled.
        Your reason for cancellation: {reason}
        Deadline: 1.1.2024 11:00

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        Additional information about cancellation:
        [PERUUTETUN VARAUKSEN OHJEET]

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_cancelled__render__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_CANCELLED, language="en")
    context["handled_payment_due_by"] = None

    html_content = render_html(email_type=EmailType.RESERVATION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been cancelled.

        Your reason for cancellation: My plans have changed
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about cancellation

        [PERUUTETUN VARAUKSEN OHJEET]

        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_cancelled__render__html__handled_payment():
    context = get_mock_data(email_type=EmailType.RESERVATION_CANCELLED, language="en")
    context["handled_payment_due_by"] = "1.1.2024 11:00"
    context["cancel_reason"] = str(ReservationCancelReasonChoice.NOT_PAID.label)

    html_content = render_html(email_type=EmailType.RESERVATION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    reason = "The booking was not paid for or invoice was not selected as the payment method by the deadline."

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been cancelled.

        Your reason for cancellation: {reason}
        Deadline: 1.1.2024 11:00
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about cancellation

        [PERUUTETUN VARAUKSEN OHJEET]

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_cancelled__send_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_cancelled__send_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_reservation_cancelled__send_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for the 'reservation cancelled' email"
