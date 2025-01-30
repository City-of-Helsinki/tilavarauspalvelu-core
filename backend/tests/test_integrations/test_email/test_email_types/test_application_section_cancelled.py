# type: EmailType.APPLICATION_SECTION_CANCELLED

from __future__ import annotations

from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_application_section_cancelled

from tests.factories import ApplicationFactory, ApplicationSectionFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01")
def test_get_context_for_application_section_cancelled__en(email_reservation):
    section = email_reservation.actions.get_application_section()

    with TranslationsFromPOFiles():
        context = get_context_for_application_section_cancelled(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            cancel_reason="[PERUUTUKSEN SYY]",
            application_id=section.application_id,
            application_section_id=section.id,
            language="en",
        )

    details_url = f"https://fake.varaamo.hel.fi/en/applications/{section.application_id}/view?tab=reservations&section={section.id}"
    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Your seasonal booking has been cancelled",
        "seasonal_booking_label": "Seasonal Booking",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        "check_booking_details_url": f"{details_url}",
        "check_booking_details_url_html": f'<a href="{details_url}">varaamo.hel.fi</a>',
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_application_section_cancelled(
            application_section=email_reservation.actions.get_application_section(),
            language="en",
        )


@freeze_time("2024-01-01")
def test_get_context_for_application_section_cancelled__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_section_cancelled(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            cancel_reason="[PERUUTUKSEN SYY]",
            application_id=None,
            application_section_id=None,
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivarauksesi on peruttu",
        "seasonal_booking_label": "Kausivaraus",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **BASE_TEMPLATE_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_application_section_cancelled_sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_section_cancelled(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            cancel_reason="[PERUUTUKSEN SYY]",
            application_id=None,
            application_section_id=None,
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Din säsongsbokning har avbokats",
        "seasonal_booking_label": "Säsongsbokning",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **BASE_TEMPLATE_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_section_cancelled_email_text():
    context = get_mock_data(email_type=EmailType.APPLICATION_SECTION_CANCELLED, language="en")
    text_content = render_text(email_type=EmailType.APPLICATION_SECTION_CANCELLED, context=context)
    text_content = text_content.replace("&amp;", "&")

    assert text_content == cleandoc(
        """
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        All space reservations included in your seasonal booking have been cancelled.
        Reason: [PERUUTUKSEN SYY]

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        You can check your booking details at: https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678

        Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_section_cancelled_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_SECTION_CANCELLED, language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_SECTION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        All space reservations included in your seasonal booking have been cancelled.

        Reason: [PERUUTUKSEN SYY]
        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
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
def test_email_service__send_application_section_cancelled_email(outbox):
    application = ApplicationFactory.create_in_status_results_sent(
        user__email="user@email.com",
        contact_person__email="contact@email.com",
    )
    application_section = application.application_sections.first()

    create_reservation_series(
        user=application_section.application.user,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
    )

    EmailService.send_application_section_cancelled(application_section=application_section)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_application_section_cancelled_email__no_reservations_email_not_sent(outbox):
    application_section = ApplicationSectionFactory.create_in_status_handled(application__user__email="user@email.com")

    EmailService.send_application_section_cancelled(application_section=application_section)

    assert len(outbox) == 0
