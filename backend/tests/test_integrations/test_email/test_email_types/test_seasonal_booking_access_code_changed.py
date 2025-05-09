# type: EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED

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
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_access_code_changed
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

from tests.factories import ApplicationFactory, ApplicationRoundFactory, RecurringReservationFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series
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
        "title": "The door code of your booking has changed",
        "text_reservation_modified": "The door code of your booking has changed",
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
        "title": "Varauksesi ovikoodi on vaihtunut",
        "text_reservation_modified": "Varauksesi ovikoodi on vaihtunut",
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
        "title": "Dörrkoden för din bokning har ändrats",
        "text_reservation_modified": "Dörrkoden för din bokning har ändrats",
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
def test_seasonal_booking_access_code_changed__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "access_code_is_used": True,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_code_changed(**get_mock_params(**params))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_access_code_changed__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "access_code_is_used": True,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED, **params)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_access_code_changed__get_context__instance(email_reservation):
    section = email_reservation.actions.get_application_section()
    reservations = section.actions.get_reservations()

    reservations.update(access_type=AccessType.ACCESS_CODE)

    assert len(reservations) == 2
    reservation_1 = reservations[0]
    reservation_2 = reservations[1]

    PindoraService.get_access_code.return_value = pindora_seasonal_booking_info(
        reservation_id__0=reservation_1.id,
        reservation_id__1=reservation_2.id,
        reservation_series_id__0=reservation_1.recurring_reservation.id,
        reservation_series_id__1=reservation_2.recurring_reservation.id,
    )

    expected: dict[str, Any] = {
        **deepcopy(LANGUAGE_CONTEXT["en"]),
        **get_application_details_urls(section),
    }

    expected["allocations"][0]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_1.id}"
    expected["allocations"][1]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_2.id}"

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_code_changed(section, language="en")

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_access_code_changed__get_context__instance__inactive(email_reservation):
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
        reservation_series_id__0=reservation_1.recurring_reservation.id,
        reservation_series_id__1=reservation_2.recurring_reservation.id,
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
        context = get_context_for_seasonal_booking_access_code_changed(section, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_code_changed__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED, context=context)
    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        The door code of your booking has changed.

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
def test_seasonal_booking_access_code_changed__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_ACCESS_CODE_CHANGED, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The door code of your booking has changed.

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
@patch_method(PindoraService.get_access_code)
def test_seasonal_booking_access_code_changed__send_email(outbox):
    ext_uuid = uuid.uuid4()

    PindoraService.get_access_code.return_value = PindoraSeasonalBookingResponse(
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
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create(
        user=user,
        contact_person__email="contact@email.com",
        sent_date=local_datetime(),
        application_round=application_round,
    )
    reservation_series = create_reservation_series(
        user=user,
        reservation_unit__uuid=ext_uuid,
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_code_changed_email(section)

    assert len(outbox) == 1

    assert outbox[0].subject == "The door code of your booking has changed"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_code_changed__send_email__no_reservations(outbox):
    user = UserFactory.create(email="user@email.com")
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create(
        user=user,
        contact_person__email="contact@email.com",
        sent_date=local_datetime(),
        application_round=application_round,
    )
    reservation_series = RecurringReservationFactory.create(
        user=user,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_code_changed_email(section)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_seasonal_booking_access_code_changed__send_email__no_recipients(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create(
        user=None,
        contact_person=None,
        sent_date=local_datetime(),
        application_round=application_round,
    )
    reservation_series = create_reservation_series(
        user=None,
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_code_changed_email(section)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
