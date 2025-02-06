# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES


from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import EmailType, ReservationTypeChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_reservation_modified_series

from tests.helpers import TranslationsFromPOFiles
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
    "time_value": "13:00-15:00",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "The time of the space reservation included in your seasonal booking has changed",
        "text_reservation_modified": "The time of the space reservation included in your seasonal booking has changed",
        "weekday_value": "Monday",
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "text_reservation_modified": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "weekday_value": "Maanantai",
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "text_reservation_modified": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "weekday_value": "Måndag",
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context_for_seasonal_reservation_modified_series(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series(
            **get_mock_params(**params, language=lang),
            language=lang,
        )
        assert context == expected

        context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES, **params, language=lang)
        assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context_for_seasonal_reservation_modified_series__instance(email_reservation):
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
        context = get_context_for_seasonal_reservation_modified_series(
            **get_mock_params(**params, language="en"),
            language="en",
        )
        assert context == expected

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series(
            reservation_series=email_reservation.recurring_reservation, language="en"
        )
        assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_modified_series__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES, context=context)
    text_content = text_content.replace("&amp;", "&")

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The time of the space reservation included in your seasonal booking has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        Day: Monday
        Time: 13:00-15:00

        You can check your booking details at: https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_modified_series__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The time of the space reservation included in your seasonal booking has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        Day: Monday
        Time: 13:00-15:00
        You can check your booking details at: [varaamo.hel.fi](https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678)

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_seasonal_reservation_modified_series(outbox):
    reservation_series = create_reservation_series(
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application__user__email="user@email.com",
        allocated_time_slot__reservation_unit_option__application_section__application__contact_person__email="contact@email.com",
    )

    EmailService.send_seasonal_reservation_modified_series_email(reservation_series=reservation_series)

    assert len(outbox) == 1

    assert outbox[0].subject == "The time of the space reservation included in your seasonal booking has changed"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_email_service__send_seasonal_reservation_modified_series__email_not_sent__no_allocated_time_slot(outbox):
    reservation_series = create_reservation_series(
        user__email="user@email.com",
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__reservee_email="reservee@email.com",
        allocated_time_slot=None,
    )

    EmailService.send_seasonal_reservation_modified_series_email(reservation_series=reservation_series)

    assert len(outbox) == 0
