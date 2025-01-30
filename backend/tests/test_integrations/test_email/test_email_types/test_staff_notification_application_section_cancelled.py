# type: EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED

from __future__ import annotations

from inspect import cleandoc

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType, ReservationNotification, WeekdayChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context.application import (
    get_context_for_staff_notification_application_section_cancelled,
)
from tilavarauspalvelu.integrations.email.template_context.common import get_staff_reservations_ext_link
from tilavarauspalvelu.models import Reservation

from tests.factories import ApplicationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    html_email_to_text,
)

# CONTEXT ##############################################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01")
def test_get_context_for_staff_notification_application_section_cancelled__en(email_reservation):
    reservation_id_1 = email_reservation.id
    reservation_id_2 = Reservation.objects.exclude(id=reservation_id_1).first().id

    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_application_section_cancelled(
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            cancel_reason="[PERUUTUKSEN SYY]",
            cancelled_reservation_series=[
                {
                    "weekday_value": "Monday",
                    "time_value": "12:00:00-14:00:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=reservation_id_1),
                },
                {
                    "weekday_value": "Tuesday",
                    "time_value": "21:00:00-22:00:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=reservation_id_2),
                },
            ],
            language="en",
        )

    assert context == {
        "email_recipient_name": None,
        "title": "The customer has canceled the seasonal booking",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "cancelled_reservation_series": [
            {
                "weekday_value": "Monday",
                "time_value": "12:00:00-14:00:00",
                "reservation_url": f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_id_1}",
            },
            {
                "weekday_value": "Tuesday",
                "time_value": "21:00:00-22:00:00",
                "reservation_url": f"https://fake.varaamo.hel.fi/kasittely/reservations/{reservation_id_2}",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_EN,
    }

    with TranslationsFromPOFiles():
        assert context == get_context_for_staff_notification_application_section_cancelled(
            application_section=email_reservation.actions.get_application_section(),
            language="en",
        )


@freeze_time("2024-01-01")
def test_get_context_for_staff_notification_application_section_cancelled__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_application_section_cancelled(
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            cancel_reason="[PERUUTUKSEN SYY]",
            language="fi",
            cancelled_reservation_series=[
                {
                    "weekday_value": WeekdayChoice.MONDAY.label,
                    "time_value": "12:00:00-14:00:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=1234),
                },
                {
                    "weekday_value": WeekdayChoice.TUESDAY.label,
                    "time_value": "21:00:00-22:00:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=5678),
                },
            ],
        )

    assert context == {
        "email_recipient_name": None,
        "title": "Asiakas on perunut kausivarauksen",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "cancelled_reservation_series": [
            {
                "weekday_value": "Monday",
                "time_value": "12:00:00-14:00:00",
                "reservation_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
            },
            {
                "weekday_value": "Tuesday",
                "time_value": "21:00:00-22:00:00",
                "reservation_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_staff_notification_application_section_cancelled_sv():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_application_section_cancelled(
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            cancel_reason="[PERUUTUKSEN SYY]",
            language="sv",
            cancelled_reservation_series=[
                {
                    "weekday_value": WeekdayChoice.MONDAY.label,
                    "time_value": "12:00:00-14:00:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=1234),
                },
                {
                    "weekday_value": WeekdayChoice.TUESDAY.label,
                    "time_value": "21:00:00-22:00:00",
                    "reservation_url": get_staff_reservations_ext_link(reservation_id=5678),
                },
            ],
        )

    assert context == {
        "email_recipient_name": None,
        "title": "Kunden har avbokat säsongsbokningen",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "cancelled_reservation_series": [
            {
                "weekday_value": "Monday",
                "time_value": "12:00:00-14:00:00",
                "reservation_url": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
            },
            {
                "weekday_value": "Tuesday",
                "time_value": "21:00:00-22:00:00",
                "reservation_url": "https://fake.varaamo.hel.fi/kasittely/reservations/5678",
            },
        ],
        **BASE_TEMPLATE_CONTEXT_SV,
    }


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_staff_notification_application_section_cancelled_email_text():
    context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED, language="en")
    text_content = render_text(email_type=EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED, context=context)

    assert text_content == cleandoc(
        """
        Hi,

        The customer has canceled all space reservations included in the seasonal booking.

        Reason: [PERUUTUKSEN SYY]

        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]

        You can view the booking at:

        Monday 13:00-15:00
        https://fake.varaamo.hel.fi/kasittely/reservations/1234
        Tuesday 21:00-22:00
        https://fake.varaamo.hel.fi/kasittely/reservations/5678

        Kind regards
        Varaamo

        This is an automated message, please do not reply.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_staff_notification_application_section_cancelled_email__html():
    context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED, language="en")
    html_content = render_html(email_type=EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        The customer has canceled all space reservations included in the seasonal booking.

        Reason: [PERUUTUKSEN SYY]
        Seasonal Booking: [HAKEMUKSEN OSAN NIMI], [KAUSIVARAUSKIERROKSEN NIMI]
        You can view the booking at:
        Monday: 13:00-15:00
        <https://fake.varaamo.hel.fi/kasittely/reservations/1234>
        Tuesday: 21:00-22:00
        <https://fake.varaamo.hel.fi/kasittely/reservations/5678>

        Kind regards
        Varaamo
        This is an automated message, please do not reply.

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


# SEND EMAILS ##########################################################################################################


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_staff_notification_application_section_cancelled_email(outbox):
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
    )
    create_reservation_series(
        user=application.user,
        reservation_unit=reservation_unit_2,
        allocated_time_slot__reservation_unit_option__reservation_unit=reservation_unit_2,
        allocated_time_slot__reservation_unit_option__application_section=application_section,
        reservations__reservee_email="reservee@email.com",
    )

    with TranslationsFromPOFiles():
        EmailService.send_staff_notification_application_section_cancelled(
            application_section=application.application_sections.first()
        )

    assert len(outbox) == 2

    assert outbox[0].subject == "Asiakas on perunut kausivarauksen"
    assert sorted(outbox[0].bcc) == ["admin1@email.com"]

    assert outbox[1].subject == "The customer has canceled the seasonal booking"
    assert sorted(outbox[1].bcc) == ["admin2@email.com"]
