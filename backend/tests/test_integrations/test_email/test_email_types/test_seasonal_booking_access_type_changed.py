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
from tilavarauspalvelu.integrations.email.template_context import get_context_for_seasonal_booking_access_type_changed
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.typing import (
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingResponse,
)
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import local_datetime

from tests.factories import ApplicationFactory, ReservationSeriesFactory, ReservationUnitAccessTypeFactory, UserFactory
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
        "title": "Access to your season booking is changing",
        "text_reservation_modified": (
            "Access to your season booking is changing. "
            "You can find the access method in this message and on the 'My applications' "
            "(https://fake.varaamo.hel.fi/en/applications) page at Varaamo."
        ),
        "text_reservation_modified_html": (
            "Access to your season booking is changing. "
            "You can find the access method in this message and on the "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications'</a> page at Varaamo."
        ),
        "reservation_units": [
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "access_types": [
                    {
                        "access_type": "staff",
                        "begin_date": "1.1.2023",
                        "end_date": "31.5.2023",
                    },
                    {
                        "access_type": "door code",
                        "begin_date": "1.6.2023",
                        "end_date": "31.12.2023",
                    },
                ],
            },
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "access_types": [
                    {
                        "access_type": "direct access",
                        "begin_date": "1.2.2023",
                        "end_date": None,
                    },
                ],
            },
        ],
        **BASE_TEMPLATE_CONTEXT_EN,
        **KEYLESS_ENTRY_CONTEXT_EN,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **COMMON_CONTEXT,
        "access_types_label": "Access to the space",
    },
    "fi": {
        "title": "Kausivarauksesi kulkutapa muuttuu",
        "text_reservation_modified": (
            "Kausivarauksesi kulkutapa muuttuu. "
            "Löydät kulkutavan tästä viestistä sekä 'Omat hakemukset' "
            "(https://fake.varaamo.hel.fi/applications) -sivulta Varaamosta."
        ),
        "text_reservation_modified_html": (
            "Kausivarauksesi kulkutapa muuttuu. "
            "Löydät kulkutavan tästä viestistä sekä "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset'</a> -sivulta Varaamosta."
        ),
        "reservation_units": [
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "access_types": [
                    {
                        "access_type": "henkilökunta",
                        "begin_date": "1.1.2023",
                        "end_date": "31.5.2023",
                    },
                    {
                        "access_type": "ovikoodi",
                        "begin_date": "1.6.2023",
                        "end_date": "31.12.2023",
                    },
                ],
            },
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "access_types": [
                    {
                        "access_type": "suora pääsy",
                        "begin_date": "1.2.2023",
                        "end_date": None,
                    },
                ],
            },
        ],
        **BASE_TEMPLATE_CONTEXT_FI,
        **KEYLESS_ENTRY_CONTEXT_FI,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **COMMON_CONTEXT,
        "access_types_label": "Pääsy tilaan",
    },
    "sv": {
        "title": "Tillträdet till din säsongsbokning håller på att ändras",
        "text_reservation_modified": (
            "Tillträdet till din säsongsbokning håller på att ändras. "
            "Du hittar tillträdet i detta meddelande samt på sidan 'Egna ansökningar' "
            "(https://fake.varaamo.hel.fi/sv/applications) på Varaamo."
        ),
        "text_reservation_modified_html": (
            "Tillträdet till din säsongsbokning håller på att ändras. "
            "Du hittar tillträdet i detta meddelande samt på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Egna ansökningar'</a> på Varaamo."
        ),
        "reservation_units": [
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "access_types": [
                    {
                        "access_type": "personalen",
                        "begin_date": "1.1.2023",
                        "end_date": "31.5.2023",
                    },
                    {
                        "access_type": "dörrkod",
                        "begin_date": "1.6.2023",
                        "end_date": "31.12.2023",
                    },
                ],
            },
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "access_types": [
                    {
                        "access_type": "direkt tillgång",
                        "begin_date": "1.2.2023",
                        "end_date": None,
                    },
                ],
            },
        ],
        **BASE_TEMPLATE_CONTEXT_SV,
        **KEYLESS_ENTRY_CONTEXT_SV,
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **COMMON_CONTEXT,
        "access_types_label": "Tillträde till utrymmet",
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_access_type_changed__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    args = {
        "application_id": 0,
        "application_section_id": 0,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        params = get_mock_params(**args)
        context = get_context_for_seasonal_booking_access_type_changed(**params)

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_access_type_changed__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    params = {
        "application_id": 0,
        "application_section_id": 0,
        "language": lang,
    }
    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, **params)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__get_context__instance(email_reservation):
    section = email_reservation.actions.get_application_section()

    email_reservation.reservation_unit.access_types.update(access_type=AccessType.PHYSICAL_KEY)

    expected: dict[str, Any] = {
        **deepcopy(LANGUAGE_CONTEXT["en"]),
        **get_application_details_urls(section),
        "reservation_units": [
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "access_types": [
                    {
                        "access_type": "key",
                        "begin_date": "1.1.2024",
                        "end_date": None,
                    },
                ],
            }
        ],
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_type_changed(section, language="en")

    assert context == expected


@pytest.mark.django_db
@patch_method(PindoraService.get_access_code, return_value=pindora_seasonal_booking_info())
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__get_context__instance__access_code(email_reservation):
    section = email_reservation.actions.get_application_section()

    email_reservation.reservation_unit.access_types.update(access_type=AccessType.ACCESS_CODE)
    email_reservation.access_type = AccessType.ACCESS_CODE
    email_reservation.save(update_fields=["access_type"])

    expected: dict[str, Any] = {
        **deepcopy(LANGUAGE_CONTEXT["en"]),
        **get_application_details_urls(section),
        "access_code": "123456",
        "access_code_is_used": True,
        "reservation_units": [
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "access_types": [
                    {
                        "access_type": "door code",
                        "begin_date": "1.1.2024",
                        "end_date": None,
                    },
                ],
            }
        ],
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_type_changed(section, language="en")

    assert context == expected

    assert PindoraService.get_access_code.called is True


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__get_context__multiple(email_reservation):
    section = email_reservation.actions.get_application_section()

    email_reservation.reservation_unit.access_types.update(access_type=AccessType.PHYSICAL_KEY)

    # Past access type, should not be included in the context
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=email_reservation.reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=datetime.date(2023, 12, 30),
    )

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=email_reservation.reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=datetime.date(2024, 2, 1),
    )

    expected: dict[str, Any] = {
        **deepcopy(LANGUAGE_CONTEXT["en"]),
        **get_application_details_urls(section),
        "reservation_units": [
            {
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "access_types": [
                    {
                        "access_type": "key",
                        "begin_date": "1.1.2024",
                        "end_date": "31.1.2024",
                    },
                    {
                        "access_type": "door code",
                        "begin_date": "1.2.2024",
                        "end_date": None,
                    },
                ],
            }
        ],
    }

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_access_type_changed(section, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, context=context)

    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    body = (
        "Access to your season booking is changing. "
        "You can find the access method in this message and on the "
        "'My applications' (https://fake.varaamo.hel.fi/en/applications) page at Varaamo."
    )

    assert text_content == cleandoc(
        f"""
        Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],

        {body}

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]


        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Access to the space:
        * staff: 1.1.2023 - 31.5.2023
        * door code: 1.6.2023 - 31.12.2023

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Access to the space:
        * direct access: 1.2.2023 -

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__render__text__access_code():
    context = get_mock_data(
        email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED,
        access_code_is_used=True,
        access_code="123456",
        language="en",
    )
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, context=context)

    text_content = text_content.replace("&amp;", "&")
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    body = (
        "Access to your season booking is changing. "
        "You can find the access method in this message and on the "
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
        Access to the space:
        * staff: 1.1.2023 - 31.5.2023
        * door code: 1.6.2023 - 31.12.2023

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Access to the space:
        * direct access: 1.2.2023 -

        You can check your booking details at: {url}

        {EMAIL_CLOSING_TEXT_EN}
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    body = (
        "Access to your season booking is changing. "
        "You can find the access method in this message and on the "
        "['My applications'](https://fake.varaamo.hel.fi/en/applications) page at Varaamo."
    )

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        {body}

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Access to the space:

        * staff: 1.1.2023 - 31.5.2023
        * door code: 1.6.2023 - 31.12.2023

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Access to the space:

        * direct access: 1.2.2023 -

        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__render__html__access_code():
    context = get_mock_data(
        email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED,
        access_code_is_used=True,
        access_code="123456",
        language="en",
    )
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_ACCESS_TYPE_CHANGED, context=context)
    text_content = html_email_to_text(html_content)
    url = "https://fake.varaamo.hel.fi/en/applications/1234/view?tab=reservations&section=5678"

    body = (
        "Access to your season booking is changing. "
        "You can find the access method in this message and on the "
        "['My applications'](https://fake.varaamo.hel.fi/en/applications) page at Varaamo."
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
        Access to the space:

        * staff: 1.1.2023 - 31.5.2023
        * door code: 1.6.2023 - 31.12.2023

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI], [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        Access to the space:

        * direct access: 1.2.2023 -

        You can check your booking details at: [varaamo.hel.fi]({url})

        {EMAIL_CLOSING_HTML_EN}
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(PindoraClient.get_seasonal_booking)
def test_seasonal_booking_access_type_changed__send_email(outbox):
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

    EmailService.send_seasonal_booking_access_type_changed_email(section)

    assert len(outbox) == 1

    assert outbox[0].subject == "Access to your season booking is changing"
    assert sorted(outbox[0].bcc) == ["contact@email.com", "user@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_access_type_changed__send_email__no_reservations(outbox):
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

    EmailService.send_seasonal_booking_access_type_changed_email(section)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
@patch_method(SentryLogger.log_message)
def test_seasonal_booking_access_type_changed__send_email__no_recipients(outbox):
    application = ApplicationFactory.create(
        user__email="",
        contact_person_email=None,
        sent_at=local_datetime(),
        application_round__sent_at=local_datetime(),
    )
    reservation_series = create_reservation_series(
        user__email="",
        reservations__type=ReservationTypeChoice.SEASONAL,
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
        allocated_time_slot__reservation_unit_option__application_section__application=application,
    )

    section = reservation_series.allocated_time_slot.reservation_unit_option.application_section

    EmailService.send_seasonal_booking_access_type_changed_email(section)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
