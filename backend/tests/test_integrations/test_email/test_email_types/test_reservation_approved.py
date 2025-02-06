# type: EmailType.RESERVATION_APPROVED

from __future__ import annotations

import datetime
from decimal import Decimal
from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import AccessType, EmailType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_reservation_approved
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraReservationResponse
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
    KEYLESS_ENTRY_CONTEXT_EN,
    KEYLESS_ENTRY_CONTEXT_FI,
    KEYLESS_ENTRY_CONTEXT_SV,
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
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__en(email_reservation):
    email_reservation.reservation_units.update(
        reservation_confirmed_instructions_en='<p>[HYVÄKSYTYN VARAUKSEN OHJEET] <a href="https://foo.bar">LINK</a></p>'
    )

    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal(0),
            non_subsidised_price=Decimal(0),
            tax_percentage=Decimal(0),
            reservation_id=email_reservation.id,
            instructions_confirmed='<p>[HYVÄKSYTYN VARAUKSEN OHJEET] <a href="https://foo.bar">LINK</a></p>',
            access_code_is_used=False,
            access_code="",
            access_code_validity_period="",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Your booking is now confirmed",
        "instructions_confirmed_html": '<p>[HYVÄKSYTYN VARAUKSEN OHJEET] <a href="https://foo.bar">LINK</a></p>',
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET] LINK <https://foo.bar>",
        "title": "Your booking is confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        "reservation_id": f"{email_reservation.id}",
        "price": Decimal(0),
        "subsidised_price": Decimal(0),
        "tax_percentage": Decimal(0),
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_reservation_approved(
            reservation=email_reservation,
            language="en",
        )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__discount__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("14.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=1234,
            instructions_confirmed="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            access_code_is_used=False,
            access_code="",
            access_code_validity_period="",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Your booking has been confirmed with the following discount:",
        "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Your booking is confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
    }


@patch_method(
    PindoraClient.get_reservation,
    return_value=PindoraReservationResponse(
        access_code="123456",
        begin=datetime.datetime(2024, 1, 1, 11),
        end=datetime.datetime(2024, 1, 1, 15),
    ),
)
@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__access_code__en(email_reservation):
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal(0),
            non_subsidised_price=Decimal(0),
            tax_percentage=Decimal(0),
            reservation_id=email_reservation.id,
            instructions_confirmed="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            access_code_is_used=True,
            access_code="123456",
            access_code_validity_period="11:00-15:00",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Your booking is now confirmed",
        "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Your booking is confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        "reservation_id": f"{email_reservation.id}",
        "price": Decimal(0),
        "subsidised_price": Decimal(0),
        "tax_percentage": Decimal(0),
    }

    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save()
    with TranslationsFromPOFiles():
        assert context == get_context_for_reservation_approved(
            reservation=email_reservation,
            language="en",
        )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=1234,
            instructions_confirmed="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            access_code_is_used=False,
            access_code="",
            access_code_validity_period="",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Varauksesi on nyt vahvistettu",
        "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Varauksesi on vahvistettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
    }


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__discount__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("14.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=1234,
            instructions_confirmed="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            access_code_is_used=False,
            access_code="",
            access_code_validity_period="",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Varauksesi on hyväksytty, ja varaukseen on myönnetty seuraava alennus:",
        "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Varauksesi on vahvistettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
    }


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=1234,
            instructions_confirmed="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            access_code_is_used=False,
            access_code="",
            access_code_validity_period="",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Din bokning har bekräftats",
        "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Din bokning är bekräftad",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
    }


@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__reservation_approved__discount__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="[VARAUSYKSIKÖN NIMI]",
            unit_name="[TOIMIPISTEEN NIMI]",
            unit_location="[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 15),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("14.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=1234,
            instructions_confirmed="[HYVÄKSYTYN VARAUKSEN OHJEET]",
            access_code_is_used=False,
            access_code="",
            access_code_validity_period="",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "text_reservation_approved": "Din bokning har bekräftats med följande rabatt:",
        "instructions_confirmed_html": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "instructions_confirmed_text": "[HYVÄKSYTYN VARAUKSEN OHJEET]",
        "title": "Din bokning är bekräftad",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
    )
    text_content = render_text(email_type=EmailType.RESERVATION_APPROVED, context=context)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract "
        "and cancellation on the 'My bookings' page: https://fake.varaamo.hel.fi/en/reservations."
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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__discount__text():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("15.30"),
    )
    text_content = render_text(email_type=EmailType.RESERVATION_APPROVED, context=context)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract "
        "and cancellation on the 'My bookings' page: https://fake.varaamo.hel.fi/en/reservations."
    )

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

        {manage}

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
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

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract "
        "and cancellation on the 'My bookings' page: https://fake.varaamo.hel.fi/en/reservations."
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

        You can access the space with the door code.
        Door code: 123456
        Validity period of the door code: 11:00-15:00

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

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract "
        "and cancellation on the 'My bookings' page: https://fake.varaamo.hel.fi/en/reservations."
    )
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
def test_render_reservation_approved__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
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
def test_render_reservation_approved__discount__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("15.30"),
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
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
def test_render_reservation_approved__access_code__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        access_code_is_used=True,
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
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

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )
    access_code_text = (
        "You can see the door code on the "
        "<a href=\"https://fake.varaamo.hel.fi/en/reservations\">'My bookings' page</a> at Varaamo. "
        "If the code is not visible in your booking details, please contact "
        '<a href="https://fake.varaamo.hel.fi/feedback?lang=en">Varaamo customer service</a>.'
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

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
