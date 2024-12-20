# ruff: noqa: RUF001
from __future__ import annotations

import datetime
from decimal import Decimal

from freezegun import freeze_time

from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_seasonal_reservation_cancelled_single,
    get_context_for_seasonal_reservation_modified_series,
    get_context_for_seasonal_reservation_modified_single,
    get_context_for_seasonal_reservation_rejected_series,
    get_context_for_seasonal_reservation_rejected_single,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
)

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
    RESERVATION_BASIC_INFO_CONTEXT_EN,
    RESERVATION_BASIC_INFO_CONTEXT_FI,
    RESERVATION_BASIC_INFO_CONTEXT_SV,
    RESERVATION_MANAGE_LINK_CONTEXT_EN,
    RESERVATION_MANAGE_LINK_CONTEXT_FI,
    RESERVATION_MANAGE_LINK_CONTEXT_SV,
    RESERVATION_PRICE_INFO_CONTEXT_EN,
    RESERVATION_PRICE_INFO_CONTEXT_FI,
    RESERVATION_PRICE_INFO_CONTEXT_SV,
    RESERVATION_PRICE_RANGE_INFO_CONTEXT_EN,
    RESERVATION_PRICE_RANGE_INFO_CONTEXT_FI,
    RESERVATION_PRICE_RANGE_INFO_CONTEXT_SV,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
    SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
)

# type: EmailType.RESERVATION_APPROVED #################################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_approved__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "text_reservation_approved": "Your booking is now confirmed",
        "instructions_label": "Additional information about your booking",
        "instructions": "These are the instructions",
        "title": "Your booking is confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_approved__discount__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("14.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "text_reservation_approved": "Your booking has been confirmed with the following discount:",
        "instructions_label": "Additional information about your booking",
        "instructions": "These are the instructions",
        "title": "Your booking is confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_approved__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "text_reservation_approved": "Varauksesi on nyt vahvistettu",
        "instructions_label": "Lisätietoa varauksestasi",
        "instructions": "Tässä ovat ohjeet",
        "title": "Varauksesi on vahvistettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_approved__discount__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("14.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "text_reservation_approved": "Varauksesi on hyväksytty, ja varaukseen on myönnetty seuraava alennus:",
        "instructions_label": "Lisätietoa varauksestasi",
        "instructions": "Tässä ovat ohjeet",
        "title": "Varauksesi on vahvistettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_approved__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "text_reservation_approved": "Din bokning har bekräftats",
        "instructions_label": "Mer information om din bokning",
        "instructions": "Här är instruktionerna",
        "title": "Din bokning är bekräftad",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_approved__discount__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_approved(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            non_subsidised_price=Decimal("14.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "text_reservation_approved": "Din bokning har bekräftats med följande rabatt:",
        "instructions_label": "Mer information om din bokning",
        "instructions": "Här är instruktionerna",
        "title": "Din bokning är bekräftad",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.RESERVATION_CANCELLED ################################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_cancelled__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_cancelled(
            email_recipient_name="John Doe",
            cancel_reason="This is a reason",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            cancelled_instructions="This are the instructions",
            language="en",
        )

    assert context == {
        "cancel_reason": "This is a reason",
        "cancel_reason_label": "Your reason for cancellation",
        "instructions": "This are the instructions",
        "instructions_label": "Additional information about cancellation",
        "email_recipient_name": "John Doe",
        "title": "Your booking has been cancelled",
        "text_reservation_cancelled": "Your booking has been cancelled",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_cancelled__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_cancelled(
            email_recipient_name="Mikko Mallikas",
            cancel_reason="Tässä on syyni",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            cancelled_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "cancel_reason": "Tässä on syyni",
        "cancel_reason_label": "Peruutuksen syy",
        "instructions": "Tässä ovat ohjeet",
        "instructions_label": "Lisätietoa peruutuksesta",
        "email_recipient_name": "Mikko Mallikas",
        "text_reservation_cancelled": "Varauksesi on peruttu",
        "title": "Varauksesi on peruttu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_cancelled__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_cancelled(
            email_recipient_name="Magnus Persson",
            cancel_reason="Här är anledningen",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            cancelled_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "cancel_reason": "Här är anledningen",
        "cancel_reason_label": "Din anledning till avbokning",
        "instructions": "Här är instruktionerna",
        "instructions_label": "Mer information om avbokning",
        "email_recipient_name": "Magnus Persson",
        "text_reservation_cancelled": "Din bokning har avbokats",
        "title": "Din bokning har avbokats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.RESERVATION_CONFIRMED ################################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_confirmed__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_confirmed(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "instructions": "These are the instructions",
        "instructions_label": "Additional information about your booking",
        "text_reservation_confirmed": "You have made a new booking",
        "title": "Thank you for your booking at Varaamo",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_confirmed__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_confirmed(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Nämä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "instructions": "Nämä ovat ohjeet",
        "instructions_label": "Lisätietoa varauksestasi",
        "text_reservation_confirmed": "Olet tehnyt uuden varauksen",
        "title": "Kiitos varauksestasi Varaamossa",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_confirmed__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_confirmed(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "instructions": "Här är instruktionerna",
        "instructions_label": "Mer information om din bokning",
        "text_reservation_confirmed": "Du har gjort en ny bokning",
        "title": "Tack för din bokning på Varaamo",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.RESERVATION_MODIFIED #################################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_modified__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_modified(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "text_reservation_modified": "Your booking has been updated",
        "instructions_label": "Additional information about your booking",
        "instructions": "These are the instructions",
        "title": "Your booking has been updated",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_modified__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_modified(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "text_reservation_modified": "Varaustasi on muutettu",
        "instructions_label": "Lisätietoa varauksestasi",
        "instructions": "Tässä ovat ohjeet",
        "title": "Varaustasi on muutettu",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_modified__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_modified(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            confirmed_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "text_reservation_modified": "Din bokning har uppdaterats",
        "instructions_label": "Mer information om din bokning",
        "instructions": "Här är instruktionerna",
        "title": "Din bokning har uppdaterats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.RESERVATION_REJECTED #################################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_rejected__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_rejected(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="This is the rejection reason",
            reservation_id=12,
            cancelled_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "booking_number_label": "Booking number",
        "reservation_id": "12",
        "rejection_reason_label": "Reason",
        "rejection_reason": "This is the rejection reason",
        "text_reservation_rejected": "Unfortunately your booking cannot be confirmed",
        "instructions_label": "Additional information",
        "instructions": "These are the instructions",
        "title": "Unfortunately your booking cannot be confirmed",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_rejected__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_rejected(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="Tässä on hylkäyksen syy",
            reservation_id=12,
            cancelled_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "booking_number_label": "Varausnumero",
        "reservation_id": "12",
        "rejection_reason_label": "Syy",
        "rejection_reason": "Tässä on hylkäyksen syy",
        "text_reservation_rejected": "Valitettavasti varaustasi ei voida vahvistaa",
        "instructions_label": "Lisätietoa",
        "instructions": "Tässä ovat ohjeet",
        "title": "Valitettavasti varaustasi ei voida vahvistaa",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_rejected__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_rejected(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="Här är orsaken till avslagningen",
            reservation_id=12,
            cancelled_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "booking_number_label": "Bokningsnummer",
        "reservation_id": "12",
        "rejection_reason_label": "Orsak",
        "rejection_reason": "Här är orsaken till avslagningen",
        "text_reservation_rejected": "Tyvärr kan vi inte bekräfta din bokning",
        "instructions_label": "Mer information",
        "instructions": "Här är instruktionerna",
        "title": "Tyvärr kan vi inte bekräfta din bokning",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.RESERVATION_REQUIRES_HANDLING ########################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("12.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            pending_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "text_pending_notification": (
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request."
        ),
        "text_reservation_requires_handling": "You have made a new booking request",
        "instructions_label": "Additional information about your booking",
        "instructions": "These are the instructions",
        "title": "Your booking is waiting for processing",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_RANGE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("12.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            pending_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "text_pending_notification": (
            "Saat varausvahvistuksen sähköpostitse, kun varauksesi on käsitelty. "
            "Otamme sinuun yhteyttä, jos tarvitsemme lisätietoja varauspyyntöösi liittyen."
        ),
        "text_reservation_requires_handling": "Olet tehnyt alustavan varauksen",
        "instructions_label": "Lisätietoa varauksestasi",
        "instructions": "Tässä ovat ohjeet",
        "title": "Varauksesi odottaa käsittelyä",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_RANGE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("12.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            pending_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "text_pending_notification": (
            "Du kommer att få en bekräftelse via e-post när din bokning har behandlats. "
            "Vi kommer att kontakta dig om ytterligare information behövs angående din bokningsförfrågan."
        ),
        "text_reservation_requires_handling": "Du har gjort en ny bokningsförfrågan",
        "instructions_label": "Mer information om din bokning",
        "instructions": "Här är instruktionerna",
        "title": "Din bokning väntar på att behandlas",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_RANGE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_handling__subsidised():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_handling(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            subsidised_price=Decimal("10.30"),
            applying_for_free_of_charge=True,
            tax_percentage=Decimal("25.5"),
            reservation_id=12,
            pending_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "text_pending_notification": (
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request."
        ),
        "text_reservation_requires_handling": "You have made a new booking request",
        "instructions_label": "Additional information about your booking",
        "instructions": "These are the instructions",
        "title": "Your booking is waiting for processing",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_RANGE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
        "subsidised_price": Decimal("10.30"),
        "price_can_be_subsidised": True,
    }


# type: EmailType.RESERVATION_REQUIRES_PAYMENT #########################################################################


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_payment__en():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(
            email_recipient_name="John Doe",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            payment_due_date=datetime.date(2024, 2, 1),
            reservation_id=12,
            confirmed_instructions="These are the instructions",
            language="en",
        )

    assert context == {
        "email_recipient_name": "John Doe",
        "payment_due_date_label": "Due date",
        "payment_due_date": "1.2.2024",
        "text_reservation_requires_payment": "Your booking has been confirmed, and can be paid",
        "pay_reservation_link_html": '<a href="https://fake.varaamo.hel.fi/en/reservations">Pay the booking</a>',
        "pay_reservation_link": "Pay the booking: https://fake.varaamo.hel.fi/en/reservations",
        "instructions_label": "Additional information about your booking",
        "instructions": "These are the instructions",
        "title": "Your booking has been confirmed, and can be paid",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **RESERVATION_PRICE_INFO_CONTEXT_EN,
        **RESERVATION_MANAGE_LINK_CONTEXT_EN,
        **CLOSING_POLITE_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_payment__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(
            email_recipient_name="Mikko Mallikas",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            payment_due_date=datetime.date(2024, 2, 1),
            reservation_id=12,
            confirmed_instructions="Tässä ovat ohjeet",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "Mikko Mallikas",
        "payment_due_date_label": "Eräpäivä",
        "payment_due_date": "1.2.2024",
        "text_reservation_requires_payment": "Varauksesi on hyväksytty, ja sen voi maksaa pankkitunnuksilla",
        "pay_reservation_link_html": '<a href="https://fake.varaamo.hel.fi/reservations">Maksa varaus</a>',
        "pay_reservation_link": "Maksa varaus: https://fake.varaamo.hel.fi/reservations",
        "instructions_label": "Lisätietoa varauksestasi",
        "instructions": "Tässä ovat ohjeet",
        "title": "Varauksesi on hyväksytty, ja sen voi maksaa pankkitunnuksilla",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **RESERVATION_PRICE_INFO_CONTEXT_FI,
        **RESERVATION_MANAGE_LINK_CONTEXT_FI,
        **CLOSING_POLITE_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__reservation_requires_payment__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_reservation_requires_payment(
            email_recipient_name="Magnus Persson",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            price=Decimal("12.30"),
            tax_percentage=Decimal("25.5"),
            payment_due_date=datetime.date(2024, 2, 1),
            reservation_id=12,
            confirmed_instructions="Här är instruktionerna",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "Magnus Persson",
        "payment_due_date_label": "Förfallodatum",
        "payment_due_date": "1.2.2024",
        "text_reservation_requires_payment": "Din bokning har bekräftats och kan betalas",
        "pay_reservation_link_html": '<a href="https://fake.varaamo.hel.fi/sv/reservations">Betala bokningen</a>',
        "pay_reservation_link": "Betala bokningen: https://fake.varaamo.hel.fi/sv/reservations",
        "instructions_label": "Mer information om din bokning",
        "instructions": "Här är instruktionerna",
        "title": "Din bokning har bekräftats och kan betalas",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **RESERVATION_PRICE_INFO_CONTEXT_SV,
        **RESERVATION_MANAGE_LINK_CONTEXT_SV,
        **CLOSING_POLITE_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE #################################################################################


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_cancelled_single__en():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_cancelled_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            cancel_reason="[PERUUTUKSEN SYY]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "The space reservation included in your seasonal booking has been cancelled",
        "text_reservation_cancelled": "The space reservation included in your seasonal booking has been cancelled",
        "cancel_reason_label": "Reason",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "check_booking_details_text": "You can check your booking details at",
        "check_booking_details_url": "https://fake.varaamo.hel.fi/en/applications",
        "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/en/applications">https://fake.varaamo.hel.fi/en/applications</a>',
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_cancelled_single__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_cancelled_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            cancel_reason="[PERUUTUKSEN SYY]",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "text_reservation_cancelled": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "cancel_reason_label": "Syy",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "check_booking_details_text": "Voit käydä tarkistamassa varauksesi tiedot osoitteessa",
        "check_booking_details_url": "https://fake.varaamo.hel.fi/applications",
        "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/applications">https://fake.varaamo.hel.fi/applications</a>',
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_cancelled_single__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_cancelled_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            cancel_reason="[PERUUTUKSEN SYY]",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "text_reservation_cancelled": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "cancel_reason_label": "Orsak",
        "cancel_reason": "[PERUUTUKSEN SYY]",
        "check_booking_details_text": "Du kan kontrollera dina bokningsuppgifter på",
        "check_booking_details_url": "https://fake.varaamo.hel.fi/sv/applications",
        "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/sv/applications">https://fake.varaamo.hel.fi/sv/applications</a>',
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES #################################################################################


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_modified_series__en():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "The time of the space reservation included in your seasonal booking has changed",
        "text_reservation_modified": "The time of the space reservation included in your seasonal booking has changed",
        "seasonal_booking_label": "Seasonal Booking",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "weekday_label": "Day",
        "weekday_value": "[VIIKONPÄIVÄ]",
        "time_label": "Time",
        "time_value": "[KELLONAIKA]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_modified_series__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "text_reservation_modified": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "seasonal_booking_label": "Kausivaraus",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "weekday_label": "Päivä",
        "weekday_value": "[VIIKONPÄIVÄ]",
        "time_label": "Kellonaika",
        "time_value": "[KELLONAIKA]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_modified_series__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_series(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "text_reservation_modified": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "seasonal_booking_label": "Säsongsbokning",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "weekday_label": "Dag",
        "weekday_value": "[VIIKONPÄIVÄ]",
        "time_label": "Tid",
        "time_value": "[KELLONAIKA]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE #################################################################################


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_modified_single__en():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "The time of the space reservation included in your seasonal booking has changed",
        "text_reservation_modified": "The time of the space reservation included in your seasonal booking has changed",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_modified_single__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        "text_reservation_modified": "Kausivaraukseesi kuuluvan tilavarauksen ajankohta on muuttunut",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_modified_single__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_modified_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        "text_reservation_modified": "Tiden för lokalbokningen som ingår i din säsongsbokning har ändrats",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.SEASONAL_RESERVATION_REJECTED_SERIES #################################################################################


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_rejected_series__en():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_series(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            language="en",
            rejection_reason="[HYLKÄYKSEN SYY]",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Your seasonal booking has been cancelled",
        "text_reservation_rejected": "The space reservation included in your seasonal booking has been cancelled",
        "seasonal_booking_label": "Seasonal Booking",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "weekday_label": "Day",
        "weekday_value": "[VIIKONPÄIVÄ]",
        "time_label": "Time",
        "time_value": "[KELLONAIKA]",
        "rejection_reason_label": "Reason",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_rejected_series__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_series(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            rejection_reason="[HYLKÄYKSEN SYY]",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivarauksesi on peruttu",
        "text_reservation_rejected": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "seasonal_booking_label": "Kausivaraus",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "weekday_label": "Päivä",
        "weekday_value": "[VIIKONPÄIVÄ]",
        "time_label": "Kellonaika",
        "time_value": "[KELLONAIKA]",
        "rejection_reason_label": "Syy",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **BASE_TEMPLATE_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for__seasonal_reservation_rejected_series_sv():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_series(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            weekday_value="[VIIKONPÄIVÄ]",
            time_value="[KELLONAIKA]",
            application_section_name="[HAKEMUKSEN OSAN NIMI]",
            application_round_name="[KAUSIVARAUSKIERROKSEN NIMI]",
            rejection_reason="[HYLKÄYKSEN SYY]",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Din säsongsbokning har avbokats",
        "text_reservation_rejected": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "seasonal_booking_label": "Säsongsbokning",
        "application_section_name": "[HAKEMUKSEN OSAN NIMI]",
        "application_round_name": "[KAUSIVARAUSKIERROKSEN NIMI]",
        "weekday_label": "Dag",
        "weekday_value": "[VIIKONPÄIVÄ]",
        "time_label": "Tid",
        "time_value": "[KELLONAIKA]",
        "rejection_reason_label": "Orsak",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **BASE_TEMPLATE_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE #################################################################################


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_rejected_single__en():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="[HYLKÄYKSEN SYY]",
            language="en",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "The space reservation included in your seasonal booking has been cancelled",
        "text_reservation_rejected": "The space reservation included in your seasonal booking has been cancelled",
        "rejection_reason_label": "Reason",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN,
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_CONTEXT_EN,
        **AUTOMATIC_REPLY_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_rejected_single__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="[HYLKÄYKSEN SYY]",
            language="fi",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "text_reservation_rejected": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
        "rejection_reason_label": "Syy",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI,
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_CONTEXT_FI,
        **AUTOMATIC_REPLY_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context_for_seasonal_reservation_rejected_single__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_seasonal_reservation_rejected_single(
            email_recipient_name="[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            rejection_reason="[HYLKÄYKSEN SYY]",
            language="sv",
        )

    assert context == {
        "email_recipient_name": "[SÄHKÖPOSTIN VASTAANOTTAJAN NIMI]",
        "title": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "text_reservation_rejected": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
        "rejection_reason_label": "Orsak",
        "rejection_reason": "[HYLKÄYKSEN SYY]",
        **SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV,
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_CONTEXT_SV,
        **AUTOMATIC_REPLY_CONTEXT_SV,
    }


# type: EmailType.STAFF_NOTIFICATION_RESERVATION_MADE ##################################################################


@freeze_time("2024-01-01")
def test_get_context__staff_notification_reservation_made__en():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_made(
            reservee_name="John Doe",
            reservation_name="Test reservation",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            reservation_id=12,
            language="en",
        )

    assert context == {
        "email_recipient_name": None,
        "reservation_name": "Test reservation",
        "booking_number_label": "Booking number",
        "reservation_id": "12",
        "reservee_name_label": "Reservee name",
        "reservee_name": "John Doe",
        "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/12",
        "staff_reservations_ext_link_html": (
            '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/12">'
            "https://fake.varaamo.hel.fi/kasittely/reservations/12</a>"
        ),
        "text_check_details": "You can view the booking at",
        "text_staff_reservation_made": "A new booking has been confirmed for Test reservation unit",
        "title": "New booking 12 has been made for Test unit",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_STAFF_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__staff_notification_reservation_made__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_made(
            reservee_name="Mikko Mallikas",
            reservation_name="Test reservation",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            reservation_id=12,
            language="fi",
        )

    assert context == {
        "email_recipient_name": None,
        "reservation_name": "Test reservation",
        "booking_number_label": "Varausnumero",
        "reservation_id": "12",
        "reservee_name_label": "Varaajan nimi",
        "reservee_name": "Mikko Mallikas",
        "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/12",
        "staff_reservations_ext_link_html": (
            '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/12">'
            "https://fake.varaamo.hel.fi/kasittely/reservations/12</a>"
        ),
        "text_check_details": "Voit tarkistaa varauksen tiedot osoitteessa",
        "text_staff_reservation_made": "Varausyksikköön Test reservation unit on tehty uusi hyväksytty varaus",
        "title": "Toimipisteeseen Test unit on tehty uusi tilavaraus 12",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_STAFF_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__staff_notification_reservation_made__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_made(
            reservee_name="Magnus Persson",
            reservation_name="Test reservation",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            reservation_id=12,
            language="sv",
        )

    assert context == {
        "email_recipient_name": None,
        "reservation_name": "Test reservation",
        "booking_number_label": "Bokningsnummer",
        "reservation_id": "12",
        "reservee_name_label": "Bokare",
        "reservee_name": "Magnus Persson",
        "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/12",
        "staff_reservations_ext_link_html": (
            '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/12">'
            "https://fake.varaamo.hel.fi/kasittely/reservations/12</a>"
        ),
        "text_check_details": "Du kan se bokningen på",
        "text_staff_reservation_made": "En ny bokningsförfrågan för Test reservation unit har bekräftats",
        "title": "Ny bokning 12 har gjorts för Test unit",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_STAFF_CONTEXT_SV,
    }


# type: EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING #####################################################


@freeze_time("2024-01-01")
def test_get_context__staff_notification_reservation_requires_handling__en():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_requires_handling(
            reservee_name="John Doe",
            reservation_name="Test reservation",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            reservation_id=12,
            language="en",
        )

    assert context == {
        "email_recipient_name": None,
        "reservation_name": "Test reservation",
        "booking_number_label": "Booking number",
        "reservation_id": "12",
        "reservee_name_label": "Reservee name",
        "reservee_name": "John Doe",
        "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/12",
        "staff_reservations_ext_link_html": (
            '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/12">'
            "https://fake.varaamo.hel.fi/kasittely/reservations/12</a>"
        ),
        "text_check_details": "You can view and handle the booking at",
        "text_staff_reservation_requires_handling": (
            "A booking request for Test reservation unit is waiting for processing"
        ),
        "title": "New booking 12 requires handling at unit Test unit",
        **BASE_TEMPLATE_CONTEXT_EN,
        **RESERVATION_BASIC_INFO_CONTEXT_EN,
        **CLOSING_STAFF_CONTEXT_EN,
    }


@freeze_time("2024-01-01")
def test_get_context__staff_notification_reservation_requires_handling__fi():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_requires_handling(
            reservee_name="Mikko Mallikas",
            reservation_name="Test reservation",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            reservation_id=12,
            language="fi",
        )

    assert context == {
        "email_recipient_name": None,
        "reservation_name": "Test reservation",
        "booking_number_label": "Varausnumero",
        "reservation_id": "12",
        "reservee_name_label": "Varaajan nimi",
        "reservee_name": "Mikko Mallikas",
        "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/12",
        "staff_reservations_ext_link_html": (
            '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/12">'
            "https://fake.varaamo.hel.fi/kasittely/reservations/12</a>"
        ),
        "text_check_details": "Voit tarkistaa ja käsitellä varauksen osoitteessa",
        "text_staff_reservation_requires_handling": (
            "Varausyksikköön Test reservation unit on tehty uusi käsittelyä vaativa varauspyyntö"
        ),
        "title": "Uusi tilavaraus 12 odottaa käsittelyä toimipisteessä Test unit",
        **BASE_TEMPLATE_CONTEXT_FI,
        **RESERVATION_BASIC_INFO_CONTEXT_FI,
        **CLOSING_STAFF_CONTEXT_FI,
    }


@freeze_time("2024-01-01")
def test_get_context__staff_notification_reservation_requires_handling__sv():
    with TranslationsFromPOFiles():
        context = get_context_for_staff_notification_reservation_requires_handling(
            reservee_name="Magnus Persson",
            reservation_name="Test reservation",
            reservation_unit_name="Test reservation unit",
            unit_name="Test unit",
            unit_location="Test location",
            begin_datetime=datetime.datetime(2024, 1, 1, 12),
            end_datetime=datetime.datetime(2024, 1, 1, 14),
            reservation_id=12,
            language="sv",
        )

    assert context == {
        "email_recipient_name": None,
        "reservation_name": "Test reservation",
        "booking_number_label": "Bokningsnummer",
        "reservation_id": "12",
        "reservee_name_label": "Bokare",
        "reservee_name": "Magnus Persson",
        "staff_reservations_ext_link": "https://fake.varaamo.hel.fi/kasittely/reservations/12",
        "staff_reservations_ext_link_html": (
            '<a href="https://fake.varaamo.hel.fi/kasittely/reservations/12">'
            "https://fake.varaamo.hel.fi/kasittely/reservations/12</a>"
        ),
        "text_check_details": "Du kan se bokningen på",
        "text_staff_reservation_requires_handling": (
            "En ny bokningsförfrågan för Test reservation unit väntar på at behandlats"
        ),
        "title": "Ny bokningsförfrågan 12 för Test unit väntar på at behandlats",
        **BASE_TEMPLATE_CONTEXT_SV,
        **RESERVATION_BASIC_INFO_CONTEXT_SV,
        **CLOSING_STAFF_CONTEXT_SV,
    }
