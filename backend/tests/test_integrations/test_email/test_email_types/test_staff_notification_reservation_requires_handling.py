# type: EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING

from __future__ import annotations

from inspect import cleandoc
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_mock_params
from tilavarauspalvelu.enums import ReservationNotification, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_staff_notification_reservation_requires_handling,
)
from tilavarauspalvelu.integrations.email.typing import EmailType
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ReservationFactory, UnitFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_integrations.test_email.helpers import (
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    EMAIL_LOGO_HTML,
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
    html_email_to_text,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


# CONTEXT ##############################################################################################################


COMMON_CONTEXT = {
    "email_recipient_name": None,
    "reservee_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
    "reservation_id": "1234",
    "reservation_name": "[VARAUKSEN NIMI]",
    "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/1234",
    "staff_reservations_ext_link_html": (
        '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/1234">'
        "https://fake.varaamo.hel.fi/kasittely/reservations/1234</a>"
    ),
}
LANGUAGE_CONTEXT = {
    "en": {
        "title": "New booking 1234 requires handling at unit [TOIMIPISTEEN NIMI]",
        "text_staff_reservation_requires_handling": (
            "A booking request for [VARAUSYKSIKÖN NIMI] is waiting for processing"
        ),
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **COMMON_CONTEXT,
    },
    "fi": {
        "title": "Uusi tilavaraus 1234 odottaa käsittelyä toimipisteessä [TOIMIPISTEEN NIMI]",
        "text_staff_reservation_requires_handling": (
            "Varausyksikköön [VARAUSYKSIKÖN NIMI] on tehty uusi käsittelyä vaativa varauspyyntö"
        ),
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **COMMON_CONTEXT,
    },
    "sv": {
        "title": "Ny bokningsförfrågan 1234 för [TOIMIPISTEEN NIMI] väntar på at behandlats",
        "text_staff_reservation_requires_handling": (
            "En ny bokningsförfrågan för [VARAUSYKSIKÖN NIMI] väntar på at behandlats"
        ),
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **COMMON_CONTEXT,
    },
}


@pytest.mark.parametrize("lang", ["en", "fi", "sv"])
@freeze_time("2024-01-01T12:00:00+02:00")
def test_get_context__staff_notification_reservation_requires_handling(lang: Lang):
    expected = LANGUAGE_CONTEXT[lang]

    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_requires_handling(**get_mock_params(), language=lang)
        assert context == expected

        context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, language=lang)
        assert context == expected


@pytest.mark.django_db
@freeze_time("2024-01-01 12:00:00+02:00")
def test_get_context__staff_notification_reservation_requires_handling__instance(email_reservation):
    staff_urls = {
        "staff_reservations_ext_link": f"https://fake.varaamo.hel.fi/kasittely/reservations/{email_reservation.id}",
        "staff_reservations_ext_link_html": (
            f'<a href="https://fake.varaamo.hel.fi/kasittely/reservations/{email_reservation.id}">'
            f"https://fake.varaamo.hel.fi/kasittely/reservations/{email_reservation.id}</a>"
        ),
    }

    expected = {
        **LANGUAGE_CONTEXT["en"],
        **staff_urls,
        "title": f"New booking {email_reservation.id} requires handling at unit [TOIMIPISTEEN NIMI]",
        "reservation_id": f"{email_reservation.id}",
    }

    params = {
        "reservation_id": email_reservation.id,
        **staff_urls,
    }
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_requires_handling(
            **get_mock_params(**params), language="en"
        )
        assert context == expected

    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_requires_handling(
            reservation=email_reservation, language="en"
        )
        assert context == expected


# RENDER TEXT ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_staff_notification_reservation_requires_handling__text():
    context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, language="en")
    text_content = render_text(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, context=context)

    assert text_content == cleandoc(
        """
        Hi,

        A booking request for [VARAUSYKSIKÖN NIMI] is waiting for processing: [VARAUKSEN NIMI]

        Reservee name: [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]
        Booking number: 1234

        [VARAUSYKSIKÖN NIMI]
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]

        From: 1.1.2024 at 12:00
        To: 1.1.2024 at 15:00

        You can view and handle the booking at:
        https://fake.varaamo.hel.fi/kasittely/reservations/1234

        Kind regards
        Varaamo

        This is an automated message, please do not reply.
        """
    )


# RENDER HTML ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_staff_notification_reservation_requires_handling__html():
    context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, language="en")
    html_content = render_html(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        f"""
        {EMAIL_LOGO_HTML}

        **Hi,**

        A booking request for [VARAUSYKSIKÖN NIMI] is waiting for processing: **[VARAUKSEN NIMI]**.

        Reservee name: [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]
        Booking number: 1234
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE], [KAUPUNKI]
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **15:00**

        ## You can view and handle the booking at

        <https://fake.varaamo.hel.fi/kasittely/reservations/1234>

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
def test_email_service__send_staff_notification_reservation_requires_handling_email(outbox):
    unit = UnitFactory.create(name_en="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == f"New booking {reservation.id} requires handling at unit foo"
    assert sorted(outbox[0].bcc) == ["admin@email.com"]


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_staff_notification_reservation_requires_handling_email__no_recipients(outbox):
    unit = UnitFactory.create(name="foo")

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "No recipients for staff notification reservation requires handling email"
    )


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_requires_handling_email__wrong_state(outbox):
    unit = UnitFactory.create(name="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservation_units__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


@pytest.mark.django_db
@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_requires_handling_email__multiple_recipients(outbox):
    unit = UnitFactory.create(name="foo", name_en="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin1@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="fi",
    )

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin2@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units__unit=unit,
    )

    with TranslationsFromPOFiles():
        EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 2

    assert outbox[0].subject == f"Uusi tilavaraus {reservation.id} odottaa käsittelyä toimipisteessä foo"
    assert sorted(outbox[0].bcc) == ["admin1@email.com"]

    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit foo"
    assert sorted(outbox[1].bcc) == ["admin2@email.com"]
