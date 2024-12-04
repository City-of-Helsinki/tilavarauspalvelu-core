# Note: Contexts are tested separately with translations!
from __future__ import annotations

from decimal import Decimal
from inspect import cleandoc

from freezegun import freeze_time
from html2text import html2text

from tilavarauspalvelu.admin.email_template.utils import get_mock_data
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.rendering import render_html


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


# Application ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_handled_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_HANDLED, language="en")
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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_in_allocation_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_IN_ALLOCATION, language="en")
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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_application_received_email__html():
    context = get_mock_data(email_type=EmailType.APPLICATION_RECEIVED, language="en")
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


# Permissions ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_permission_deactivation__html():
    context = get_mock_data(email_type=EmailType.PERMISSION_DEACTIVATION, language="en")
    html_content = render_html(email_type=EmailType.PERMISSION_DEACTIVATION, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        Your staff access to Varaamo will expire if you do not log in to the service within two weeks.

        Log in to the service at:
        <https://fake.varaamo.hel.fi/kasittely>

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_user_anonymization__html():
    context = get_mock_data(email_type=EmailType.USER_ANONYMIZATION, language="en")
    html_content = render_html(email_type=EmailType.USER_ANONYMIZATION, context=context)
    text_content = html_email_to_text(html_content)

    message = (
        "Your user account in the Varaamo service will expire if you do not log in within two weeks. "
        "The information will be permanently deleted if your account expires."
    )

    assert text_content == cleandoc(
        f"""
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        {message}

        You can extend the validity of your user account by logging into the service at:
        <https://fake.varaamo.hel.fi/en>

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


# Reservation ##########################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_APPROVED,
        language="en",
        price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking is now confirmed.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_approved__discount__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_APPROVED, language="en")
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been confirmed with the following discount:

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_cancelled__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_CANCELLED, language="en")

    html_content = render_html(email_type=EmailType.RESERVATION_CANCELLED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been cancelled.

        Your reason for cancellation: [PERUUTUKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about cancellation

        [PERUUTETUN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_confirmed__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_CONFIRMED, language="en")
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_modified__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_MODIFIED, language="en")
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been updated.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_rejected__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REJECTED, language="en")
    html_content = render_html(email_type=EmailType.RESERVATION_REJECTED, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Unfortunately your booking cannot be confirmed.

        Reason: [HYLKÄYKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Booking number: 1234

        ## Additional information

        [PERUUTETUN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_handling__html():
    context = get_mock_data(
        email_type=EmailType.RESERVATION_REQUIRES_HANDLING,
        language="en",
        price=Decimal("12.30"),
        subsidised_price=Decimal("12.30"),
        non_subsidised_price=Decimal("12.30"),
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking request.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        ## Additional information about your booking

        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_handling__subsidised__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_HANDLING, language="en")
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        You have made a new booking request.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **10,30 - 12,30€** (incl. VAT 25.5 %)
        Booking number: 1234

        {confirm}

        ## Additional information about your booking

        [KÄSITELTÄVÄN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_requires_payment__html():
    context = get_mock_data(email_type=EmailType.RESERVATION_REQUIRES_PAYMENT, language="en")
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

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        Your booking has been confirmed, and can be paid.

        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        Price: **12,30 €** (incl. VAT 25.5 %)
        Booking number: 1234
        Due date: **2.1.2024**
        [Pay the booking](https://fake.varaamo.hel.fi/en/reservations)

        ## Additional information about your booking

        [HYVÄKSYTYN VARAUKSEN OHJEET]

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_cancelled_single__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The space reservation included in your seasonal booking has been cancelled.

        Reason: [PERUUTUKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        You can check your booking details at: <https://fake.varaamo.hel.fi/en/applications>

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


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_seasonal_reservation_rejected_single__html():
    context = get_mock_data(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE, language="en")
    html_content = render_html(email_type=EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi [SÄHKÖPOSTIN VASTAANOTTAJAN NIMI],**

        The space reservation included in your seasonal booking has been cancelled.

        Reason: [HYLKÄYKSEN SYY]
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**
        You can check your booking details at: <https://fake.varaamo.hel.fi/en/applications>

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


# Staff ################################################################################################################


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_staff_notification_reservation_made__html():
    context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE, language="en")
    html_content = render_html(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        A new booking has been confirmed for [VARAUSYKSIKÖN NIMI]: **[VARAUKSEN NIMI]**.

        Reservee name: [VARAAJAN NIMI]
        Booking number: 1234
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**

        ## You can view the booking at

        <https://fake.varaamo.hel.fi/kasittely/reservations/1234>

        Kind regards
        Varaamo
        This is an automated message, please do not reply.

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )


@freeze_time("2024-01-01 12:00:00+02:00")
def test_render_reservation_staff_notification_reservation_requires_handling__html():
    context = get_mock_data(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, language="en")
    html_content = render_html(email_type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING, context=context)
    text_content = html_email_to_text(html_content)

    assert text_content == cleandoc(
        """
        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        **Hi,**

        A booking request for [VARAUSYKSIKÖN NIMI] is waiting for processing: **[VARAUKSEN NIMI]**.

        Reservee name: [VARAAJAN NIMI]
        Booking number: 1234
        **[VARAUSYKSIKÖN NIMI]**
        [TOIMIPISTEEN NIMI]
        [TOIMIPISTEEN OSOITE]
        From: **1.1.2024** at **12:00**
        To: **2.1.2024** at **15:00**

        ## You can view and handle the booking at

        <https://fake.varaamo.hel.fi/kasittely/reservations/1234>

        Kind regards
        Varaamo
        This is an automated message, please do not reply.

        ![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**

        (C) City of Helsinki 2024
        """
    )
