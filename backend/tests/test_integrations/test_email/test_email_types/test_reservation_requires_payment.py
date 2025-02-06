# type: EmailType.RESERVATION_REQUIRES_PAYMENT

from __future__ import annotations

import datetime
from decimal import Decimal
from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_requires_payment
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
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

# CONTEXT ##############################################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01")
def test_get_context__reservation_requires_payment__en(email_reservation):
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal(0),
            tax_percentage=Decimal(0),
            payment_due_date=datetime.date(2024, 1, 1),
            reservation_id=email_reservation.id,
            instructions="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "payment_due_date_label": "Due date",
        "payment_due_date": "1.1.2024",
        "text_reservation_requires_payment": "Your booking has been confirmed, and can be paid",
        "pay_reservation_link_html": '<a href="https://fake.varaamo.hel.fi/en/reservations">Pay the booking</a>',
        "pay_reservation_link": "Pay the booking: https://fake.varaamo.hel.fi/en/reservations",
        "instructions_label": "Additional information about your booking",
        "instructions_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Your booking has been confirmed, and can be paid",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
        "reservation_id": f"{email_reservation.id}",
        "price": 0,
        "tax_percentage": 0,
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_reservation_requires_payment(
            reservation=email_reservation,
            language="en",
        )


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_payment__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            payment_due_date=datetime.date(2024, 2, 1),
            reservation_id=12,
            instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "payment_due_date_label": "Eräpäivä",
        "payment_due_date": "1.2.2024",
        "text_reservation_requires_payment": "Varauksesi on hyväksytty, ja sen voi maksaa pankkitunnuksilla",
        "pay_reservation_link_html": '<a href="https://fake.varaamo.hel.fi/reservations">Maksa varaus</a>',
        "pay_reservation_link": "Maksa varaus: https://fake.varaamo.hel.fi/reservations",
        "instructions_label": "Lisätietoa varauksestasi",
        "instructions_html": "Tässä ovat ohjeet",
        "instructions_text": "Tässä ovat ohjeet",
        "title": "Varauksesi on hyväksytty, ja sen voi maksaa pankkitunnuksilla",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_payment__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            payment_due_date=datetime.date(2024, 2, 1),
            reservation_id=12,
            instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "payment_due_date_label": "Förfallodatum",
        "payment_due_date": "1.2.2024",
        "text_reservation_requires_payment": "Din bokning har bekräftats och kan betalas",
        "pay_reservation_link_html": '<a href="https://fake.varaamo.hel.fi/sv/reservations">Betala bokningen</a>',
        "pay_reservation_link": "Betala bokningen: https://fake.varaamo.hel.fi/sv/reservations",
        "instructions_label": "Mer information om din bokning",
        "instructions_html": "Här är instruktionerna",
        "instructions_text": "Här är instruktionerna",
        "title": "Din bokning har bekräftats och kan betalas",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_payment__text():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, language="en")
    text_content = render_text(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, context=context)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and "
        "Varaamo's terms of contract and cancellation on the 'My bookings' page: "
        "https://fake.varaamo.hel.fi/en/reservations."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        Your booking has been confirmed, and can be paid.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]

        From: 1.1.2024 at 12:00
        To: 2.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        Due date: 2.1.2024

        Pay the booking: https://fake.varaamo.hel.fi/en/reservations

        Additional information about your booking:
        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {manage}

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_payment__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, context=context)
    text_content = html_email_to_text(html_content)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been confirmed, and can be paid.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234
        Due date: **2.1.2024**
        [Pay the booking](https://fake.varaamo.hel.fi/en/reservations)

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

        {manage}
        Thank you for choosing Varaamo!
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
def test_email_service__send_reservation_requires_payment_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        price=1,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking has been confirmed, and can be paid"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_requires_payment_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        reservee_email="",
        user__email="",
        reservation_units__name="foo",
        price=1,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation requires payment email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_requires_payment_email__price_zero(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        price=0,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0
