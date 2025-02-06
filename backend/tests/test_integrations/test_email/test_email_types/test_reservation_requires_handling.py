# type: EmailType.RESERVATION_REQUIRES_HANDLING

from __future__ import annotations

import datetime
from decimal import Decimal
from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_requires_handling
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
def test_get_context__reservation_requires_handling__en(email_reservation):
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal(0),
            subsidised_price=Decimal(0),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal(0),
            reservation_id=email_reservation.id,
            instructions_pending="[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_pending_notification": (
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request."
        ),
        "text_reservation_requires_handling": "You have made a new booking request",
        "instructions_pending_html": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "instructions_pending_text": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "title": "Your booking is waiting for processing",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        "price": Decimal(0),
        "subsidised_price": Decimal(0),
        "tax_percentage": Decimal(0),
        "reservation_id": f"{email_reservation.id}",
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_reservation_requires_handling(
            reservation=email_reservation,
            language="en",
        )


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("12.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            instructions_pending="[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "text_pending_notification": (
            "Saat varausvahvistuksen sähköpostitse, kun varauksesi on käsitelty. "
            "Otamme sinuun yhteyttä, jos tarvitsemme lisätietoja varauspyyntöösi liittyen."
        ),
        "text_reservation_requires_handling": "Olet tehnyt alustavan varauksen",
        "instructions_pending_html": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "instructions_pending_text": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "title": "Varauksesi odottaa käsittelyä",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("12.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            instructions_pending="[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "text_pending_notification": (
            "Du kommer att få en bekräftelse via e-post när din bokning har behandlats. "
            "Vi kommer att kontakta dig om ytterligare information behövs angående din bokningsförfrågan."
        ),
        "text_reservation_requires_handling": "Du har gjort en ny bokningsförfrågan",
        "instructions_pending_html": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "instructions_pending_text": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "title": "Din bokning väntar på att behandlas",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__subsidised():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("10.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            instructions_pending="[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "text_pending_notification": (
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request."
        ),
        "text_reservation_requires_handling": "You have made a new booking request",
        "instructions_pending_html": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "instructions_pending_text": "[KÄSITELTÄVÄN VARAUKSEN OHJEET]",
        "title": "Your booking is waiting for processing",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        "subsidised_price": Decimal("10.30"),
        "price_can_be_subsidised": True,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_handling__text():
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

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and "
        "Varaamo's terms of contract and cancellation on the 'My bookings' page: "
        "https://fake.varaamo.hel.fi/en/reservations."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        You have made a new booking request.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]

        From: 1.1.2024 at 12:00
        To: 2.1.2024 at 15:00

        Price: 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        Additional information about your booking:
        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

        {manage}

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_handling__subsidised__text():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, language="en")
    text_content = render_text(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and "
        "Varaamo's terms of contract and cancellation on the 'My bookings' page: "
        "https://fake.varaamo.hel.fi/en/reservations."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        You have made a new booking request.

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]

        From: 1.1.2024 at 12:00
        To: 2.1.2024 at 15:00

        Price: 10,30 - 12,30 € (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        Additional information about your booking:
        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

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
def test_render_reservation_requires_handling__html():
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

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking request.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        ## Additional information about your booking

        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_handling__subsidised__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking request.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **10,30 - 12,30€** (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        ## Additional information about your booking

        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

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
@freeze_time("2024-01-01")
def test_email_service__send_reservation_requires_handling_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking is waiting for processing"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_requires_handling_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_requires_handling_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="",
        user__email="",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation requires handling email"


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_requires_handling_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0
