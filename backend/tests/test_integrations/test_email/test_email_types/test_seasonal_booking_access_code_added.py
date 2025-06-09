# type: EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED

from __future__ import annotations

import datetime
import uuid
from copy import deepcopy
from inspect import cleandoc
from typing import TYPE_CHECKING, Any

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import AccessType, ReservationTypeChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_access_code_added
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

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
    KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
    KEYLESS_ENTRY_CONTEXT_EN,
    KEYLESS_ENTRY_CONTEXT_FI,
    KEYLESS_ENTRY_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
    get_application_details_urls,
    html_email_to_text,
    pindora_seasonal_booking_info,
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
        "title": "Access to the space has changed",
        "text_reservation_modified": (
            "Access to the space has changed. "
            "You can find the door code in this message and at 'My applications' "
            "(https://fake.varaamo.hel.fi/en/applications) page at Varaamo."
        ),
        "text_reservation_modified_html": (
            "Access to the space has changed. "
            "You can find the door code in this message and at "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications'</a> page at Varaamo."
        ),
        "allocations": [
            {
                "weekday_value": "Monday",
                "time_value": "13:00-15:00",
                "access_code_validity_period": "11:00-15:00",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
            {
                "weekday_value": "Tuesday",
                "time_value": "21:00-22:00",
                "access_code_validity_period": "20:45-22:05",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
        "access_code_validity_period": "",
    },
    "fi": {
        "title": "Sisäänpääsy tilaan on muuttunut",
        "text_reservation_modified": (
            "Sisäänpääsy tilaan on muuttunut. "
            "Löydät ovikoodin tästä viestistä sekä 'Omat hakemukset' "
            "(https://fake.varaamo.hel.fi/applications) -sivulta Varaamossa."
        ),
        "text_reservation_modified_html": (
            "Sisäänpääsy tilaan on muuttunut. "
            "Löydät ovikoodin tästä viestistä sekä "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset'</a> -sivulta Varaamossa."
        ),
        "allocations": [
            {
                "weekday_value": "Maanantai",
                "time_value": "13:00-15:00",
                "access_code_validity_period": "11:00-15:00",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
            {
                "weekday_value": "Tiistai",
                "time_value": "21:00-22:00",
                "access_code_validity_period": "20:45-22:05",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
        "access_code_validity_period": "",
    },
    "sv": {
        "title": "Tillgången till utrymmet har ändrats",
        "text_reservation_modified": (
            "Tillgången till utrymmet har ändrats. "
            "Du hittar dörrkoden i detta meddelande och på sidan 'Egna ansökningar' "
            "(https://fake.varaamo.hel.fi/sv/applications) på Varaamo."
        ),
        "text_reservation_modified_html": (
            "Tillgången till utrymmet har ändrats. "
            "Du hittar dörrkoden i detta meddelande och på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Egna ansökningar'</a> på Varaamo."
        ),
        "allocations": [
            {
                "weekday_value": "Måndag",
                "time_value": "13:00-15:00",
                "access_code_validity_period": "11:00-15:00",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
            {
                "weekday_value": "Tisdag",
                "time_value": "21:00-22:00",
                "access_code_validity_period": "20:45-22:05",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
        **KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT,
        **COMMON_CONTEXT,
        "access_code_validity_period": "",
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_access_code_added__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "access_code_is_used": True,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_code_added(**get_mock_params(**params))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_access_code_added__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "access_code_is_used": True,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED, **params)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_access_code_added__get_context__instance(email_reservation):
    section = email_reservation.actions.get_application_section()
    reservations = section.actions.get_reservations()

    reservations.update(access_type=AccessType.ACCESS_CODE)

    assert len(reservations) == 2
    reservation_1 = reservations[0]
    reservation_2 = reservations[1]

    PindoraService.get_access_code.return_value = pindora_seasonal_booking_info(
        reservation_id__0=reservation_1.id,
        reservation_id__1=reservation_2.id,
        reservation_series_id__0=reservation_1.reservation_series.id,
        reservation_series_id__1=reservation_2.reservation_series.id,
    )

    expected: dict[str, Any] = {
        **deepcopy(LANGUAGE_CONTEXT["en"]),
        **get_application_details_urls(section),
    }

    expected["allocations"][0]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_1.id}"
    expected["allocations"][1]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_2.id}"

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_code_added(section, language="en")

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_access_code_added__get_context__instance__inactive(email_reservation):
    section = email_reservation.actions.get_application_section()
    reservations = section.actions.get_reservations()

    reservations.update(access_type=AccessType.ACCESS_CODE)

    assert len(reservations) == 2
    reservation_1 = reservations[0]
    reservation_2 = reservations[1]

    PindoraService.get_access_code.return_value = pindora_seasonal_booking_info(
        access_code_is_active=False,
        reservation_id__0=reservation_1.id,
        reservation_id__1=reservation_2.id,
        reservation_series_id__0=reservation_1.reservation_series.id,
        reservation_series_id__1=reservation_2.reservation_series.id,
    )

    expected: dict[str, Any] = {
        **deepcopy(LANGUAGE_CONTEXT["en"]),
        **get_application_details_urls(section),
        "access_code": "",
        "access_code_is_used": True,
    }

    expected["allocations"][0]["access_code_validity_period"] = ""
    expected["allocations"][0]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_1.id}"
    expected["allocations"][1]["access_code_validity_period"] = ""
    expected["allocations"][1]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_2.id}"

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_code_added(section, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_code_added__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED, context=context)
    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    body = (
        "Access to the space has changed. You can find the door code in this message and at "
        "'My applications' (https://fake.varaamo.hel.fi/en/applications) page at Varaamo."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        {body}

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        Door code: 123456

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Monday
        Time: 13:00-15:00
        Validity period of the door code: 11:00-15:00

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Tuesday
        Time: 21:00-22:00
        Validity period of the door code: 20:45-22:05

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_code_added__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_ADDED, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    body = (
        "Access to the space has changed. You can find the door code in this message and at "
        "['My applications'](https://fake.varaamo.hel.fi/en/applications)"
        " page at Varaamo."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        {body}

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        Door code: 123456
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Monday
        Time: 13:00-15:00
        Validity period of the door code: 11:00-15:00
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Day: Tuesday
        Time: 21:00-22:00
        Validity period of the door code: 20:45-22:05
        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraClient.get_seasonal_booking)
def test_seasonal_booking_access_code_added__send_email(outbox):
    ext_uuid = uuid.uuid4()

    PindoraClient.get_seasonal_booking.return_value = PindoraSeasonalBookingResponse(
        access_code="123456",
        reservation_unit_code_validity=[
            PindoraSeasonalBookingAccessCodeValidity(
                reservation_unit_id=ext_uuid,
                begin=datetime.datetime(2024, 1, 1, 11),
                end=datetime.datetime(2024, 1, 1, 15),
                access_code_valid_minutes_before=0,
                access_code_valid_minutes_after=0,
            ),
        ],
    )

    user = UserFactory.create(email="user@email.com")
    application = ApplicationFactory.create(
        user=user,
        contact_person_email="contact@email.com",
        sent_at=local_datetime(),
        application_round__sent_at=local_datetime(),
    )
    reservation_series = create_reservation_series(
        user=user,
        reservation_unit__ext_uuid=ext_uuid,
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_code_added_email(section)

    assert len(outbox) == 1

    assert outbox[0].subject == "Access to the space has changed"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_code_added__send_email__no_reservations(outbox):
    user = UserFactory.create(email="user@email.com")
    application = ApplicationFactory.create(
        user=user,
        contact_person_email="contact@email.com",
        sent_at=local_datetime(),
        application_round__sent_at=local_datetime(),
    )
    reservation_series = ReservationSeriesFactory.create(
        user=user,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_code_added_email(section)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_seasonal_booking_access_code_added__send_email__no_recipients(outbox):
    application = ApplicationFactory.create(
        user=None,
        contact_person_email=None,
        sent_at=local_datetime(),
        application_round__sent_at=local_datetime(),
    )
    reservation_series = create_reservation_series(
        user=None,
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_code_added_email(section)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
