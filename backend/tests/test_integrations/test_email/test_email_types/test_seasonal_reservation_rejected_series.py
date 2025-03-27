# type: EmailType.SEASONAL_RESERVATION_REJECTED_SERIES

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_reservation_rejected_series
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory, RecurringReservationFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
    get_application_details_urls,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
    "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
    "rejection_reason": "[HYLKÄYKSEN SYY]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "Your seasonal booking has been cancelled",
        "text_reservation_rejected": "The space reservation included in your seasonal booking has been cancelled",
        "allocations": [
            {"weekday_value": "Monday", "time_value": "13:00-15:00", "access_code_validity_period": ""},
            {"weekday_value": "Tuesday", "time_value": "21:00-22:00", "access_code_validity_period": ""},
        ],
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Kausivarauksesi on peruttu",
        "text_reservation_rejected": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "allocations": [
            {"weekday_value": "Maanantai", "time_value": "13:00-15:00", "access_code_validity_period": ""},
            {"weekday_value": "Tiistai", "time_value": "21:00-22:00", "access_code_validity_period": ""},
        ],
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Din säsongsbokning har avbokats",
        "text_reservation_rejected": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "allocations": [
            {"weekday_value": "Måndag", "time_value": "13:00-15:00", "access_code_validity_period": ""},
            {"weekday_value": "Tisdag", "time_value": "21:00-22:00", "access_code_validity_period": ""},
        ],
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context_for_seasonal_reservation_rejected_series(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_series(**get_mock_params(**params, language=lang))
        assert context == expected

        context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SERIES, **params, language=lang)
        assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context_for_seasonal_reservation_rejected_series__instance(email_reservation):
    section = email_reservation.actions.get_application_section()

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
    }

    params = {
        "application_id": section.application_id,
        "application_section_id": section.id,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_series(**get_mock_params(**params, language="en"))
        assert context == expected

    email_reservation.state = ReservationStateChoice.DENIED
    email_reservation.save()
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_series(application_section=section, language="en")
        assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_rejected_series__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SERIES, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SERIES, context=context)
    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The space reservation included in your seasonal booking has been cancelled.
        Reason: [HYLKÄYKSEN SYY]

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        Day: Monday
        Time: 13:00-15:00

        Day: Tuesday
        Time: 21:00-22:00


        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_rejected_series__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SERIES, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SERIES, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The space reservation included in your seasonal booking has been cancelled.

        Reason: [HYLKÄYKSEN SYY]
        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        Day: Monday
        Time: 13:00-15:00
        Day: Tuesday
        Time: 21:00-22:00
        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_seasonal_reservation_rejected_series(outbox):
    user = UserFactory.create(email="user@email.com")
    application = ApplicationFactory.create(
        user=user,
        contact_person__email="contact@email.com",
    )
    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__state=ReservationStateChoice.DENIED,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )
    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_reservation_rejected_series_email(section)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_seasonal_reservation_rejected_series__no_reservations(outbox):
    user = UserFactory.create(email="user@email.com")
    application = ApplicationFactory.create(
        user=user,
        contact_person__email="contact@email.com",
    )
    reservation_series = RecurringReservationFactory.create(
        user=user,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )
    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_reservation_rejected_series_email(section)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_email_service__send_seasonal_reservation_rejected_series__no_recipients(outbox):
    application = ApplicationFactory.create(
        user=None,
        contact_person=None,
    )
    reservation_series = create_reservation_series(
        user=None,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__state=ReservationStateChoice.DENIED,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )
    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_reservation_rejected_series_email(section)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
