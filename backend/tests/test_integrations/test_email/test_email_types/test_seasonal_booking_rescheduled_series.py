# type: EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES

from __future__ import annotations

import uuid
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import AccessType, ReservationTypeChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_rescheduled_series
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_graphql_api.test_reservation_series.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_CLOSING_HTML_EN,
    EMAIL_CLOSING_TEXT_EN,
    EMAIL_LOGO_HTML,
    KEYLESS_ENTRY_CONTEXT_EN,
    KEYLESS_ENTRY_CONTEXT_FI,
    KEYLESS_ENTRY_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
    get_application_details_urls,
    html_email_to_text,
    pindora_seasonal_booking_series_info,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
    "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "The time of the space reservation included in your seasonal booking has changed",
        "text_reservation_modified": "The time of the space reservation included in your seasonal booking has changed",
        "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
        "unit_name": "[TOIMIPISTEEN NIMI]",
        "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
        "weekday_value": "Monday",
        "time_value": "13:00-15:00",
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "text_reservation_modified": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
        "unit_name": "[TOIMIPISTEEN NIMI]",
        "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
        "weekday_value": "Maanantai",
        "time_value": "13:00-15:00",
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "text_reservation_modified": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
        "unit_name": "[TOIMIPISTEEN NIMI]",
        "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
        "weekday_value": "Måndag",
        "time_value": "13:00-15:00",
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_rescheduled_series(**get_mock_params(**params, language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
    }
    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, **params, language=lang)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__get_context__access_code():
    expected = {
        **LANGUAGE_CONTEXT["en"],
        "access_code": "123456",
        "access_code_is_used": True,
        "weekday_value": "Monday",
        "time_value": "13:00-15:00",
        "access_code_validity_period": "11:00-15:00",
    }

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "access_code_is_used": True,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_rescheduled_series(**get_mock_params(**params, language="en"))

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraClient.get_seasonal_booking)
def test_seasonal_booking_rescheduled_series__get_context__instance(email_reservation):
    section = email_reservation.actions.get_application_section()
    series = email_reservation.reservation_series

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_rescheduled_series(series, language="en")

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_rescheduled_series__get_context__instance__access_code(email_reservation):
    section = email_reservation.actions.get_application_section()
    series = email_reservation.reservation_series

    series.reservations.update(access_type=AccessType.ACCESS_CODE)

    PindoraService.get_access_code.return_value = pindora_seasonal_booking_series_info(
        reservation_id=email_reservation.id,
        reservation_series_id=series.id,
    )

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
        "access_code": "123456",
        "access_code_is_used": True,
        "weekday_value": "Monday",
        "time_value": "13:00-15:00",
        "access_code_validity_period": "11:00-15:00",
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_rescheduled_series(series, language="en")

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_rescheduled_series__get_context__instance__access_code__inactive(email_reservation):
    section = email_reservation.actions.get_application_section()
    series = email_reservation.reservation_series

    series.reservations.update(access_type=AccessType.ACCESS_CODE)

    PindoraService.get_access_code.return_value = pindora_seasonal_booking_series_info(
        access_code_is_active=False,
        reservation_id=email_reservation.id,
        reservation_series_id=series.id,
    )

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **get_application_details_urls(section),
        "access_code": "",
        "access_code_is_used": True,
        "weekday_value": "Monday",
        "time_value": "13:00-15:00",
        "access_code_validity_period": "",
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_rescheduled_series(series, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, context=context)
    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The time of the space reservation included in your seasonal booking has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Monday
        Time: 13:00-15:00

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__render__text__access_code_is_used():
    context = get_mock_data(
        email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES,
        language="en",
        access_code_is_used=True,
    )
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, context=context)
    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The time of the space reservation included in your seasonal booking has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        Door code: 123456

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Monday
        Time: 13:00-15:00
        Validity period of the door code: 11:00-15:00

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The time of the space reservation included in your seasonal booking has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Monday
        Time: 13:00-15:00
        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__render__html__access_code_is_used():
    context = get_mock_data(
        email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES,
        language="en",
        access_code_is_used=True,
    )
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_RESCHEDULED_SERIES, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The time of the space reservation included in your seasonal booking has changed.

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        Door code: 123456
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Monday
        Time: 13:00-15:00
        Validity period of the door code: 11:00-15:00
        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__send_email(outbox):
    ext_uuid = uuid.uuid4()

    user = UserFactory.create(email="user@email.com")
    application = ApplicationFactory.create(
        user=user,
        contact_person_email="contact@email.com",
    )
    series = create_reservation_series(
        user=user,
        reservation_unit__ext_uuid=ext_uuid,
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    EmailService.send_seasonal_booking_rescheduled_series_email(series)

    assert len(outbox) == 1

    assert outbox[0].subject == "The time of the space reservation included in your seasonal booking has changed"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_rescheduled_series__send_email__no_reservations(outbox):
    user = UserFactory.create(email="user@email.com")
    application = ApplicationFactory.create(
        user=user,
        contact_person_email="contact@email.com",
    )
    series = ReservationSeriesFactory.create(
        user=user,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    EmailService.send_seasonal_booking_rescheduled_series_email(series)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_seasonal_booking_rescheduled_series__send_email__no_recipients(outbox):
    application = ApplicationFactory.create(
        user__email="",
        contact_person_email=None,
    )
    series = create_reservation_series(
        user=application.user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    EmailService.send_seasonal_booking_rescheduled_series_email(series)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
