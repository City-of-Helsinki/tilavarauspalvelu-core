from __future__ import annotations

from decimal import Decimal
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_requires_payment
from tilavarauspalvelu.integrations.email.template_context.common import create_anchor_tag
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
        "title": "Your booking is confirmed, please pay online",
        "text_reservation_requires_payment": (
            "Your booking is now confirmed. "
            "Please pay online or choose invoice as the payment method by the deadline, "
            "otherwise, the booking will be automatically canceled."
        ),
        "handled_payment_due_by_label": "Deadline",
        "handled_payment_due_by": "1.1.2024 11:00",
        "handled_payment_text": "Pay the booking at Varaamo",
        "handled_payment_link": "https://fake.varaamo.hel.fi/en/reservations/1234",
        "handled_payment_link_html": create_anchor_tag(
            link="https://fake.varaamo.hel.fi/en/reservations/1234",
            text="Pay the booking at Varaamo",
        ),
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Varauksesi on vahvistettu, maksa varaus verkossa",
        "text_reservation_requires_payment": (
            "Varauksesi on nyt vahvistettu. Maksa varaus verkossa tai valitse "
            "maksutavaksi lasku, muuten varaus peruuntuu automaattisesti."
        ),
        "handled_payment_due_by_label": "Määräaika",
        "handled_payment_due_by": "1.1.2024 11:00",
        "handled_payment_text": "Maksa varaus Varaamossa",
        "handled_payment_link": "https://fake.varaamo.hel.fi/reservations/1234",
        "handled_payment_link_html": create_anchor_tag(
            link="https://fake.varaamo.hel.fi/reservations/1234",
            text="Maksa varaus Varaamossa",
        ),
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din bokning är bekräftats, vänligen betala online",
        "text_reservation_requires_payment": (
            "Din bokning har bekräftats. Vänligen betala online eller välj faktura som "
            "betalningsmetod inom tidsfristen, annars kommer bokningen automatiskt att "
            "avbokas."
        ),
        "handled_payment_due_by_label": "Tidsfrist",
        "handled_payment_due_by": "1.1.2024 11:00",
        "handled_payment_text": "Betala bokningen på Varaamo",
        "handled_payment_link": "https://fake.varaamo.hel.fi/sv/reservations/1234",
        "handled_payment_link_html": create_anchor_tag(
            link="https://fake.varaamo.hel.fi/sv/reservations/1234",
            text="Betala bokningen på Varaamo",
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
def test_reservation_requires_payment__get_context(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        "price_can_be_subsidised": False,
        "subsidised_price": Decimal("12.30"),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(**get_mock_params(language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_reservation_requires_payment__get_context__get_mock_data(lang: Lang):
    expected = {
        **LANGUAGE_CONTEXT[lang],
        "price_can_be_subsidised": False,
        "subsidised_price": Decimal("12.30"),
    }

    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, language=lang)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_payment__get_context__instance(email_reservation):
    link = f"https://fake.varaamo.hel.fi/en/reservations/{email_reservation.id}"

    PaymentOrderFactory.create(
        reservation=email_reservation,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 0),
    )

    expected = {
        **LANGUAGE_CONTEXT["en"],
        "reservation_id": f"{email_reservation.id}",
        "price_can_be_subsidised": False,
        "subsidised_price": Decimal("12.30"),
        "handled_payment_link_html": create_anchor_tag(link=link, text="Pay the booking at Varaamo"),
        "handled_payment_link": link,
    }

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(reservation=email_reservation, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_payment__render__text():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, language="en")
    text_content = render_text(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, context=context)

    body_text = (
        "Your booking is now confirmed. Please pay online or choose invoice as the "
        "payment method by the deadline, otherwise, the booking will be automatically "
        "canceled."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        {body_text}

        Deadline: 1.1.2024 11:00
        Pay the booking at Varaamo: https://fake.varaamo.hel.fi/en/reservations/1234

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


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_reservation_requires_payment__render__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, context=context)
    text_content = html_email_to_text(html_content)

    body_text = (
        "Your booking is now confirmed. Please pay online or choose invoice as the "
        "payment method by the deadline, otherwise, the booking will be automatically "
        "canceled."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        {body_text}

        Deadline: 1.1.2024 11:00
        [Pay the booking at Varaamo](https://fake.varaamo.hel.fi/en/reservations/1234)
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


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_requires_payment__send_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=1,
        handled_at=local_datetime(),
        payment_order__handled_payment_due_by=local_datetime(),
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking is confirmed, please pay online"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_reservation_requires_payment__send_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        price=1,
        handled_at=local_datetime(),
        payment_order__handled_payment_due_by=local_datetime(),
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for the 'reservation requires payment' email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_requires_payment__send_email__price_zero(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=0,
        handled_at=local_datetime(),
        payment_order__handled_payment_due_by=local_datetime(),
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_requires_payment__send_email__not_handled(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=1,
        handled_at=None,
        payment_order__handled_payment_due_by=local_datetime(),
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_requires_payment__send_email__no_payment_order(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=1,
        handled_at=local_datetime(),
        payment_order=None,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_reservation_requires_payment__send_email__payment_order_not_handled_payment(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=1,
        handled_at=local_datetime(),
        payment_order__handled_payment_due_by=None,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0
