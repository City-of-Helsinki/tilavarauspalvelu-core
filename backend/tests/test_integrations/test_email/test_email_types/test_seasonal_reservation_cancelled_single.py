# type: EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE

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
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_reservation_cancelled_single

from tests.factories import ReservationFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_integrations.test_email.helpers import (
    AUTOMATIC_REPLY_CONTEXT_EN,
    AUTOMATIC_REPLY_CONTEXT_FI,
    AUTOMATIC_REPLY_CONTEXT_SV,
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    CLOSING_CONTEXT_EN,
    CLOSING_CONTEXT_FI,
    CLOSING_CONTEXT_SV,
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_cancelled_single__en(email_reservation):
    section = email_reservation.actions.get_application_section()

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_cancelled_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            cancel_reason="[PERUUTUKSEN SYY]",
            application_id=section.application_id,
            application_section_id=section.id,
            language="en",
        )

    details_url = f"https://fake.varaamo.hel.fi/en/applications/{section.application_id}/view?tab=reservations&section={section.id}"
    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "The space reservation included in your seasonal booking has been cancelled",
        "text_reservation_cancelled": "The space reservation included in your seasonal booking has been cancelled",
        "cancel_reason_label": "Reason",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
        "check_booking_details_url": f"{details_url}",
        "check_booking_details_url_html": f'<a href="{details_url}">varaamo.hel.fi</a>',
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_seasonal_reservation_cancelled_single(
            reservation=email_reservation,
            language="en",
        )


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_cancelled_single__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_cancelled_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            cancel_reason="[PERUUTUKSEN SYY]",
            application_id=None,
            application_section_id=None,
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "text_reservation_cancelled": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "cancel_reason_label": "Syy",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "check_booking_details_text": "Voit käydä tarkistamassa varauksesi tiedot osoitteessa",
        "check_booking_details_url": "https://fake.varaamo.hel.fi/applications",
        "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/applications">varaamo.hel.fi</a>',
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_cancelled_single__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_cancelled_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test Street, City",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            cancel_reason="[PERUUTUKSEN SYY]",
            application_id=None,
            application_section_id=None,
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "text_reservation_cancelled": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "cancel_reason_label": "Orsak",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "check_booking_details_text": "Du kan kontrollera dina bokningsuppgifter på",
        "check_booking_details_url": "https://fake.varaamo.hel.fi/sv/applications",
        "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/sv/applications">varaamo.hel.fi</a>',
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_cancelled_single_text():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE, context=context)
    text_content = text_content.replace("&amp;", "&")

    assert text_content == cleandoc(
        """
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The space reservation included in your seasonal booking has been cancelled.
        Reason: [PERUUTUKSEN SYY]

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]

        From: 1.1.2024 at 12:00
        To: 2.1.2024 at 15:00

        You can check your booking details at: https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678

        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_cancelled_single__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The space reservation included in your seasonal booking has been cancelled.

        Reason: [PERUUTUKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        You can check your booking details at: [varaamo.hel.fi](https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678)

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
def test_email_service__send_seasonal_reservation_cancelled_single(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        type=ReservationTypeChoice.SEASONAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "The space reservation included in your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]
