# type: EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION

from __future__ import annotations

from copy import deepcopy
from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationCancelReasonChoice, ReservationNotification
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_seasonal_booking_cancelled_all_staff_notification,
)
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.models import Reservation

from tests.factories import ApplicationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_graphql_api.test_reservation_series.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_LOGO_HTML,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": None,
    "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
    "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "The customer has canceled the seasonal booking",
        "cancel_reason": "My plans have changed",
        "allocations": [
            {
                "weekday_value": "Monday",
                "time_value": "13:00-15:00",
                "access_code_validity_period": "",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
            {
                "weekday_value": "Tuesday",
                "time_value": "21:00-22:00",
                "access_code_validity_period": "",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Asiakas on perunut kausivarauksen",
        "cancel_reason": "Suunnitelmiini tuli muutos",
        "allocations": [
            {
                "weekday_value": "Maanantai",
                "time_value": "13:00-15:00",
                "access_code_validity_period": "",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
            {
                "weekday_value": "Tiistai",
                "time_value": "21:00-22:00",
                "access_code_validity_period": "",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Kunden har avbokat säsongsbokningen",
        "cancel_reason": "Mina planer har ändrats",
        "allocations": [
            {
                "weekday_value": "Måndag",
                "time_value": "13:00-15:00",
                "access_code_validity_period": "",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
            {
                "weekday_value": "Tisdag",
                "time_value": "21:00-22:00",
                "access_code_validity_period": "",
                "series_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
                "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
                "unit_name": "[TOIMIPISTEEN NIMI]",
                "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_cancelled_all_staff_notification__get_context(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_cancelled_all_staff_notification(**get_mock_params(language=lang))

    assert context == expected


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_seasonal_booking_cancelled_all_staff_notification__get_context__get_mock_data(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION, language=lang)

    assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all_staff_notification__get_context__instance(email_reservation):
    reservation_id_1 = email_reservation.id
    reservation_id_2 = Reservation.objects.exclude(id=reservation_id_1).first().id

    section = email_reservation.actions.get_application_section()
    section = email_reservation.actions.get_application_section()

    section.actions.get_reservations().update(cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS)

    expected = deepcopy(LANGUAGE_CONTEXT["en"])

    expected["allocations"][0]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_id_1}"
    expected["allocations"][1]["series_url"] = f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_id_2}"

    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_booking_cancelled_all_staff_notification(section, language="en")

    assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all_staff_notification__render__text():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION, language="en")
    text_content = render_text(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION, context=context)

    assert text_content == cleandoc(
        """
        Hi,

        The customer has canceled all space reservations included in the seasonal booking.

        Reason: My plans have changed

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        You can view the booking at:

        Monday: 13:00-15:00
        https://fake.varaamo.hel.fi/kasittely/reservations/1234

        Tuesday: 21:00-22:00
        https://fake.varaamo.hel.fi/kasittely/reservations/5678

        Kind regards
        Varaamo

        This is an automated message, please do not reply.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all_staff_notification__render__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_BOOKING_CANCELLED_ALL_STAFF_NOTIFICATION, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi,**

        The customer has canceled all space reservations included in the seasonal booking.

        Reason: My plans have changed
        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        You can view the booking at:
        Monday: 13:00-15:00
        <https://fake.varaamo.hel.fi/kasittely/reservations/1234>
        Tuesday: 21:00-22:00
        <https://fake.varaamo.hel.fi/kasittely/reservations/5678>

        Kind regards
        Varaamo
        This is an automated message, please do not reply.

        {EMAIL_LOGO_HTML}

        (C) City of Helsinki 2024
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01 12:00:00+02:00")
def test_seasonal_booking_cancelled_all_staff_notification__send_email(outbox):
    application = ApplicationFactory.create_in_status_results_sent(user__email="user@email.com")
    application_section = application.application_sections.first()

    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    UserFactory.create_with_unit_role(
        units=[reservation_unit_1.unit],
        email="admin1@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="fi",
    )
    UserFactory.create_with_unit_role(
        units=[reservation_unit_2.unit],
        email="admin2@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    create_reservation_series(
        user=application.user,
        reservation_unit=reservation_unit_1,
        allocated_time_slot__reservation_unit_option__reservation_unit=reservation_unit_1,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
        reservations__reservee_email="reservee@email.com",
        reservations__cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    )
    create_reservation_series(
        user=application.user,
        reservation_unit=reservation_unit_2,
        allocated_time_slot__reservation_unit_option__reservation_unit=reservation_unit_2,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
        reservations__reservee_email="reservee@email.com",
        reservations__cancel_reason=ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    )

    with TranslationsFromPOFiles():
        EmailService.send_seasonal_booking_cancelled_all_staff_notification_email(
            application_section=application.application_sections.first()
        )

    assert len(outbox) == 2

    assert outbox[0].subject == "Asiakas on perunut kausivarauksen"
    assert sorted(outbox[0].bcc) == ["admin1@email.com"]

    assert outbox[1].subject == "The customer has canceled the seasonal booking"
    assert sorted(outbox[1].bcc) == ["admin2@email.com"]
