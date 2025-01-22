# ruff: noqa: RUF001
from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import WeekdayChoice
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_application_section_cancelled,
)
from tilavarauspalvelu.integrations.email.template_context.application import (
    get_context_for_staff_notification_application_section_cancelled,
)
from tilavarauspalvelu.integrations.email.template_context.common import get_staff_reservations_ext_link
from tilavarauspalvelu.models import Reservation

from tests.helpers import TranslationsFromPOFiles
from tests.test_integrations.test_email.helpers import (
    AUTOMATIC_REPLY_CONTEXT_EN,
    AUTOMATIC_REPLY_CONTEXT_FI,
    AUTOMATIC_REPLY_CONTEXT_SV,
    BASE_TEMPLATE_CONTEXT_EN,
    BASE_TEMPLATE_CONTEXT_FI,
    BASE_TEMPLATE_CONTEXT_SV,
    CLOSING_CONTEXT_EN,
    CLOSING_CONTEXT_FI,
    CLOSING_CONTEXT_SV,
    CLOSING_POLITE_CONTEXT_EN,
    CLOSING_POLITE_CONTEXT_FI,
    CLOSING_POLITE_CONTEXT_SV,
    CLOSING_STAFF_CONTEXT_EN,
    CLOSING_STAFF_CONTEXT_FI,
    CLOSING_STAFF_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
)

# type: EmailType.APPLICATION_HANDLED ##################################################################################


@freeze_time("2024-01-01")
def test_get_context__application_handled__en():
    with TranslationsFromPOFiles():
        context = get_context_for_application_handled(language="en")

    assert context == {
        "email_recipient_name": None,
        "text_application_handled": "Your application has been processed",
        "text_view_application": (
            "You can view the result of the processing on the "
            "'My applications' page: https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can view the result of the processing on "
            'the <a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications' page</a>"
        ),
        "title": "Your application has been processed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__application_handled__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_handled(language="fi")

    assert context == {
        "email_recipient_name": None,
        "text_application_handled": "Hakemuksesi on käsitelty",
        "text_view_application": (
            "Näet tiedon käsittelyn tuloksesta 'Omat hakemukset' -sivulla: https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Näet tiedon käsittelyn tuloksesta "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset' -sivulla</a>"
        ),
        "title": "Hakemuksesi on käsitelty",
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__application_handled__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_handled(language="sv")

    assert context == {
        "email_recipient_name": None,
        "text_application_handled": "Din ansökan har behandlats",
        "text_view_application": (
            "Du kan se resultatet av behandlingen på sidan 'Mina ansökningar': "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan se resultatet av behandlingen på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Mina ansökningar'</a>"
        ),
        "title": "Din ansökan har behandlats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.APPLICATION_IN_ALLOCATION ############################################################################


@freeze_time("2024-01-01")
def test_get_context__application_in_allocation__en():
    with TranslationsFromPOFiles():
        context = get_context_for_application_in_allocation(language="en")

    assert context == {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "The application deadline has passed. "
            "We will notify you of the result when your application has been processed."
        ),
        "text_view_application": (
            "You can view the application you have sent on the 'My applications' page: "
            "https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can view the application you have sent on the "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications' page</a>"
        ),
        "title": "Your application is being processed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__application_in_allocation__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_in_allocation(language="fi")

    assert context == {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "Hakuaika on päättynyt. Ilmoitamme käsittelyn tuloksesta, kun hakemuksesi on käsitelty."
        ),
        "text_view_application": (
            "Voit tarkastella lähettämääsi hakemusta 'Omat hakemukset' -sivulla: "
            "https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Voit tarkastella lähettämääsi hakemusta "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset' -sivulla</a>"
        ),
        "title": "Hakemustasi käsitellään",
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__application_in_allocation__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_in_allocation(language="sv")

    assert context == {
        "email_recipient_name": None,
        "text_application_in_allocation": (
            "Ansökningstiden har löpt ut. Vi skickar ett meddelande till e-postadressen när din ansökan har behandlats."
        ),
        "text_view_application": (
            "Du kan se den ansökan du har skickat på sidan 'Mina ansökningar': "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan se den ansökan du har skickat på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Mina ansökningar'</a>"
        ),
        "title": "Din ansökan behandlas",
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.APPLICATION_RECEIVED #################################################################################


@freeze_time("2024-01-01")
def test_get_context__application_received__en():
    with TranslationsFromPOFiles():
        context = get_context_for_application_received(language="en")

    assert context == {
        "email_recipient_name": None,
        "text_application_received": "Thank you for your application",
        "text_view_application": (
            "You can edit your application on the 'My applications' page until the application deadline: "
            "https://fake.varaamo.hel.fi/en/applications"
        ),
        "text_view_application_html": (
            "You can edit your application on the "
            '<a href="https://fake.varaamo.hel.fi/en/applications">'
            "'My applications' page</a> until the application deadline"
        ),
        "title": "Your application has been received",
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__application_received__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_application_received(language="fi")

    assert context == {
        "email_recipient_name": None,
        "text_application_received": "Kiitos hakemuksestasi",
        "text_view_application": (
            "Voit muokata hakemustasi 'Omat hakemukset' -sivulla hakuajan päättymiseen asti: "
            "https://fake.varaamo.hel.fi/applications"
        ),
        "text_view_application_html": (
            "Voit muokata hakemustasi "
            '<a href="https://fake.varaamo.hel.fi/applications">'
            "'Omat hakemukset' -sivulla</a> hakuajan päättymiseen asti"
        ),
        "title": "Hakemuksesi on vastaanotettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__application_received__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_application_received(language="sv")

    assert context == {
        "email_recipient_name": None,
        "text_application_received": "Tack för din ansökan",
        "text_view_application": (
            "Du kan redigera din ansökan på sidan 'Mina ansökningar' till och med ansökningstidens utgång: "
            "https://fake.varaamo.hel.fi/sv/applications"
        ),
        "text_view_application_html": (
            "Du kan redigera din ansökan på sidan "
            '<a href="https://fake.varaamo.hel.fi/sv/applications">'
            "'Mina ansökningar'</a> till och med ansökningstidens utgång"
        ),
        "title": "Din ansökan har mottagits",
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.APPLICATION_SECTION_CANCELLED #################################################################################


@pytest.mark.django_db
@freeze_time("2024-01-01")
def test_get_context_for_application_section_cancelled__en(email_reservation):
    with TranslationsFromPOFiles():
        context = get_context_for_application_section_cancelled(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            language="en",
            cancel_reason="[PERUUTUKSEN SYY]",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Your seasonal booking has been cancelled",
        "text_reservation_cancelled": "All space reservations included in your seasonal booking have been cancelled",
        "seasonal_booking_label": "Seasonal Booking",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason_label": "Reason",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
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
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivarauksesi on peruttu",
        "text_reservation_cancelled": "Kaikki kausivaraukseesi kuuluvat tilavaraukset on peruttu",
        "seasonal_booking_label": "Kausivaraus",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason_label": "Syy",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
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
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Din säsongsbokning har avbokats",
        "text_reservation_cancelled": "Alla lokalbokningar som ingår i din säsongsbokning har avbokats",
        "seasonal_booking_label": "Säsongsbokning",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason_label": "Orsak",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED #####################################################


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
            language="en",
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
        )

    assert context == {
        "email_recipient_name": None,
        "title": "The customer has canceled the seasonal booking",
        "text_reservation_cancelled": (
            "The customer has canceled all space reservations included in the seasonal booking"
        ),
        "seasonal_booking_label": "Seasonal Booking",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason_label": "Reason",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "view_booking_at_label": "You can view the booking at",
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
        **CLOSING_CONTEXT_EN,
        **CLOSING_STAFF_CONTEXT_EN,
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
        "text_reservation_cancelled": "Asiakas on perunut kaikki kausivaraukseen kuuluvat tilavaraukset",
        "seasonal_booking_label": "Kausivaraus",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason_label": "Syy",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "view_booking_at_label": "Voit tarkistaa varauksen tiedot osoitteessa",
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
        **CLOSING_CONTEXT_FI,
        **CLOSING_STAFF_CONTEXT_FI,
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
        "text_reservation_cancelled": "Kunden har avbokat alla lokalbokningar som ingår i säsongsbokningen",
        "seasonal_booking_label": "Säsongsbokning",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "cancel_reason_label": "Orsak",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "view_booking_at_label": "Du kan se bokningen på",
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
        **CLOSING_CONTEXT_SV,
        **CLOSING_STAFF_CONTEXT_SV,
    }
