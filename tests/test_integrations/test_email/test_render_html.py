# Note: Contexts are tested separately with translations!
import datetime
from decimal import Decimal
from inspect import cleandoc

from freezegun import freeze_time
from html2text import html2text

from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.rendering import render_html
from tilavarauspalvelu.integrations.email.template_context import (
    get_context_for_application_handled,
    get_context_for_application_in_allocation,
    get_context_for_application_received,
    get_context_for_reservation_approved,
    get_context_for_reservation_cancelled,
    get_context_for_reservation_confirmed,
    get_context_for_reservation_modified,
    get_context_for_reservation_rejected,
    get_context_for_reservation_requires_handling,
    get_context_for_reservation_requires_payment,
    get_context_for_staff_notification_reservation_made,
    get_context_for_staff_notification_reservation_requires_handling,
)


def html_email_to_text(html_content: str) -> str:
    """Convert a rendered email to plain text for testing purposes."""
    converted_text = html2text(html_content, bodywidth=0)

    # Cleanup the text a little bit.
    text: str = ""
    previous_was_linebreak: bool = False
    for row in converted_text.split("\n"):
        # Remove unnecessary markup.
        row = row.replace("|", "")
        row = row.replace("---", "")
        row = row.strip()

        # Remove multiple empty lines (leave the first one)
        if not row:
            if previous_was_linebreak:
                continue
            previous_was_linebreak = True
        else:
            previous_was_linebreak = False

        text += row + "\n"

    return text.strip()


@freeze_time("2024-01-01")
def test_render_application_handled_email__html():
    context = get_context_for_application_handled(language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_HANDLED, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        Your application has been processed.

        You can view the result of the processing on the ['My applications' page]({link}).

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_application_in_allocation_email__html():
    context = get_context_for_application_in_allocation(language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_IN_ALLOCATION, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        The application deadline has passed. We will notify you of the result when your application has been processed.

        You can view the application you have sent on the ['My applications' page]({link}).

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_application_received_email__html():
    context = get_context_for_application_received(language="en")
    html_content = render_html(email_type=EmailType.APPLICATION_RECEIVED, context=context)
    text_content = html_email_to_text(html_content)

    link = "https://fake.varaamo.hel.fi/en/applications"

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        Thank you for your application.

        You can edit your application on the ['My applications' page]({link}) until the application deadline.

        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_cancelled__html():
    context = get_context_for_reservation_cancelled(
        language="en",
        email_recipient_name="John Doe",
        cancel_reason="This is a reason",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        price=Decimal("12.30"),
        tax_percentage=Decimal("25.5"),
        booking_number=12,
        cancelled_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        Your booking has been cancelled.

        Your reason for cancellation: This is a reason
        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12

        ## Additional information about cancellation

        This are the instructions

        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_confirmed__html():
    context = get_context_for_reservation_confirmed(
        language="en",
        email_recipient_name="John Doe",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        price=Decimal("12.30"),
        tax_percentage=Decimal("25.5"),
        booking_number=12,
        confirmed_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_CONFIRMED, context=context)
    text_content = html_email_to_text(html_content)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        You have made a new booking.

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_approved__html():
    context = get_context_for_reservation_approved(
        language="en",
        email_recipient_name="John Doe",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
        tax_percentage=Decimal("25.5"),
        booking_number=12,
        confirmed_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
    text_content = html_email_to_text(html_content)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        Your booking is now confirmed.

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_approved__discount__html():
    context = get_context_for_reservation_approved(
        language="en",
        email_recipient_name="John Doe",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("15.30"),
        tax_percentage=Decimal("25.5"),
        booking_number=12,
        confirmed_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_APPROVED, context=context)
    text_content = html_email_to_text(html_content)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        Your booking has been confirmed with the following discount:

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_requires_handling__html():
    context = get_context_for_reservation_requires_handling(
        language="en",
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
        booking_number=12,
        pending_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        You have made a new booking request.

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12

        {confirm}

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_requires_handling__subsidised__html():
    context = get_context_for_reservation_requires_handling(
        language="en",
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
        booking_number=12,
        pending_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    confirm = (
        "You will receive a confirmation email once your booking has been processed. "
        "We will contact you if further information is needed regarding your booking "
        "request."
    )

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        You have made a new booking request.

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **10,30 - 12,30€** (incl. VAT 25.5 %)
        Booking number: 12

        {confirm}

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_modified__html():
    context = get_context_for_reservation_modified(
        language="en",
        email_recipient_name="John Doe",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        price=Decimal("12.30"),
        tax_percentage=Decimal("25.5"),
        booking_number=12,
        confirmed_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_MODIFIED, context=context)
    text_content = html_email_to_text(html_content)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        Your booking has been updated.

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_requires_payment__html():
    context = get_context_for_reservation_requires_payment(
        language="en",
        email_recipient_name="John Doe",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        price=Decimal("12.30"),
        tax_percentage=Decimal("25.5"),
        payment_due_date=datetime.date(2024, 2, 1),
        booking_number=12,
        confirmed_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, context=context)
    text_content = html_email_to_text(html_content)

    manage = (
        "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's "
        "terms of contract and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        Your booking has been confirmed, and can be paid.

        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 12
        Due date: **1.2.2024**
        [Pay the booking](https://fake.varaamo.hel.fi/en/reservations)

        ## Additional information about your booking

        This are the instructions

        {manage}
        Thank you for choosing Varaamo!
        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_rejected__html():
    context = get_context_for_reservation_rejected(
        language="en",
        email_recipient_name="John Doe",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        rejection_reason="This is the rejection reason",
        booking_number=12,
        cancelled_instructions="This are the instructions",
    )
    html_content = render_html(email_type=EmailType.RESERVATION_REJECTED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi John Doe,**

        Unfortunately your booking cannot be confirmed.

        Reason: This is the rejection reason
        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**
        Booking number: 12

        ## Additional information

        This are the instructions

        Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_staff_notification_reservation_made__html():
    context = get_context_for_staff_notification_reservation_made(
        language="en",
        reservee_name="John Doe",
        reservation_name="Test reservation",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        booking_number=12,
    )
    html_content = render_html(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        A new booking has been confirmed for Test reservation unit: **Test reservation**.

        Reservee name: John Doe
        Booking number: 12
        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**

        ## You can view the booking at

        <https://fake.varaamo.hel.fi/kasittely/reservations/12>

        Kind regards
        Varaamo
        This is an automated message, please do not reply.

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01")
def test_render_reservation_staff_notification_reservation_requires_handling__html():
    context = get_context_for_staff_notification_reservation_requires_handling(
        language="en",
        reservee_name="John Doe",
        reservation_name="Test reservation",
        reservation_unit_name="Test reservation unit",
        unit_name="Test unit",
        unit_location="Test location",
        begin_datetime=datetime.datetime(2024, 1, 1, 12),
        end_datetime=datetime.datetime(2024, 1, 1, 14),
        booking_number=12,
    )
    html_content = render_html(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        A booking request for Test reservation unit is waiting for processing: **Test reservation**.

        Reservee name: John Doe
        Booking number: 12
        **Test reservation unit**
        Test unit
        Test location
        From: **1.1.2024** at **12:00**
        To: **1.1.2024** at **14:00**

        ## You can view and handle the booking at

        <https://fake.varaamo.hel.fi/kasittely/reservations/12>

        Kind regards
        Varaamo
        This is an automated message, please do not reply.

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )
