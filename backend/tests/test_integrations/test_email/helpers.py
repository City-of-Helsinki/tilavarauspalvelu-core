from __future__ import annotations

from decimal import Decimal

from utils.utils import html_2_text


def html_email_to_text(html_content: str) -> str:
    """Convert a rendered email to plain text, used only for testing purposes."""
    converted_text = html_2_text(html_content)

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


AUTOMATIC_REPLY_CONTEXT_EN = {
    "automatic_message_do_not_reply": "This is an automated message, please do not reply",
    "contact_us": "Contact us: https://fake.varaamo.hel.fi/feedback?lang=en",
    "contact_us_html": '<a href="https://fake.varaamo.hel.fi/feedback?lang=en">Contact us</a>',
    "reserve_city_resources_at": (
        "Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en"
    ),
    "reserve_city_resources_at_html": (
        "Book the city's premises and equipment for your use at "
        '<a href="https://fake.varaamo.hel.fi/en">'
        "varaamo.hel.fi"
        "</a>"
    ),
}
AUTOMATIC_REPLY_CONTEXT_FI = {
    "automatic_message_do_not_reply": "Tämä on automaattinen viesti, johon ei voi vastata",
    "contact_us": "Ota yhteyttä: https://fake.varaamo.hel.fi/feedback?lang=fi",
    "contact_us_html": '<a href="https://fake.varaamo.hel.fi/feedback?lang=fi">Ota yhteyttä</a>',
    "reserve_city_resources_at": (
        "Varaa kaupungin tiloja ja laitteita käyttöösi helposti osoitteessa https://fake.varaamo.hel.fi"
    ),
    "reserve_city_resources_at_html": (
        "Varaa kaupungin tiloja ja laitteita käyttöösi helposti osoitteessa "
        '<a href="https://fake.varaamo.hel.fi">varaamo.hel.fi</a>'
    ),
}
AUTOMATIC_REPLY_CONTEXT_SV = {
    "automatic_message_do_not_reply": "Detta är ett automatiskt meddelande som inte kan besvaras",
    "contact_us": "Ta kontakt: https://fake.varaamo.hel.fi/feedback?lang=sv",
    "contact_us_html": '<a href="https://fake.varaamo.hel.fi/feedback?lang=sv">Ta kontakt</a>',
    "reserve_city_resources_at": (
        "Boka enkelt stadens lokaler och utrustning för eget bruk på https://fake.varaamo.hel.fi/sv"
    ),
    "reserve_city_resources_at_html": (
        "Boka enkelt stadens lokaler och utrustning för eget bruk på "
        '<a href="https://fake.varaamo.hel.fi/sv">varaamo.hel.fi</a>'
    ),
}

RESERVATION_TRANSLATIONS_CONTEXT_EN = {
    "instructions_booking_label": "Additional information about your booking",
    "instructions_cancelled_label": "Additional information about cancellation",
    "instructions_rejected_label": "Additional information",
}
RESERVATION_TRANSLATIONS_CONTEXT_FI = {
    "instructions_booking_label": "Lisätietoa varauksestasi",
    "instructions_cancelled_label": "Lisätietoa peruutuksesta",
    "instructions_rejected_label": "Lisätietoa",
}
RESERVATION_TRANSLATIONS_CONTEXT_SV = {
    "instructions_booking_label": "Mer information om din bokning",
    "instructions_cancelled_label": "Mer information om avbokning",
    "instructions_rejected_label": "Mer information",
}

BASE_TEMPLATE_CONTEXT_EN = (
    {
        "current_year": "2024",
        "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
        "helsinki_city": "City of Helsinki",
        "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
        "salutation": "Hi",
        "service_name": "Varaamo",
        "with_regards": "Kind regards",
        "thank_you_for_using": "Thank you for choosing Varaamo!",
    }
    | AUTOMATIC_REPLY_CONTEXT_EN
    | RESERVATION_TRANSLATIONS_CONTEXT_EN
)
BASE_TEMPLATE_CONTEXT_FI = (
    {
        "current_year": "2024",
        "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
        "helsinki_city": "Helsingin kaupunki",
        "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
        "salutation": "Hei",
        "service_name": "Varaamo",
        "with_regards": "Ystävällisin terveisin",
        "thank_you_for_using": "Kiitos, kun käytit Varaamoa!",
    }
    | AUTOMATIC_REPLY_CONTEXT_FI
    | RESERVATION_TRANSLATIONS_CONTEXT_FI
)
BASE_TEMPLATE_CONTEXT_SV = (
    {
        "current_year": "2024",
        "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
        "helsinki_city": "Helsingfors stad",
        "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
        "salutation": "Hej",
        "service_name": "Varaamo",
        "with_regards": "Med vänliga hälsningar",
        "thank_you_for_using": "Tack för att du använder Varaamo!",
    }
    | AUTOMATIC_REPLY_CONTEXT_SV
    | RESERVATION_TRANSLATIONS_CONTEXT_SV
)


RESERVATION_BASIC_INFO_CONTEXT_EN = {
    "reservation_unit_name": "Test reservation unit",
    "unit_name": "Test unit",
    "unit_location": "Test Street, City",
    "begins_label": "From",
    "begin_date": "1.1.2024",
    "begin_time": "12:00",
    "ends_label": "To",
    "end_date": "1.1.2024",
    "end_time": "14:00",
    "o_clock_label": "at",
}
RESERVATION_BASIC_INFO_CONTEXT_FI = {
    "reservation_unit_name": "Test reservation unit",
    "unit_name": "Test unit",
    "unit_location": "Test Street, City",
    "begins_label": "Alkamisaika",
    "begin_date": "1.1.2024",
    "begin_time": "12:00",
    "ends_label": "Päättymisaika",
    "end_date": "1.1.2024",
    "end_time": "14:00",
    "o_clock_label": "klo",
}
RESERVATION_BASIC_INFO_CONTEXT_SV = {
    "reservation_unit_name": "Test reservation unit",
    "unit_name": "Test unit",
    "unit_location": "Test Street, City",
    "begins_label": "Börjar",
    "begin_date": "1.1.2024",
    "begin_time": "12:00",
    "ends_label": "Slutar",
    "end_date": "1.1.2024",
    "end_time": "14:00",
    "o_clock_label": "kl.",
}

RESERVATION_PRICE_INFO_CONTEXT_EN = {
    "price_label": "Price",
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "vat_included_label": "incl. VAT",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Booking number",
    "reservation_id": "12",
}
RESERVATION_PRICE_INFO_CONTEXT_FI = {
    "price_label": "Hinta",
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "vat_included_label": "sis. alv",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Varausnumero",
    "reservation_id": "12",
}
RESERVATION_PRICE_INFO_CONTEXT_SV = {
    "price_label": "Pris",
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "vat_included_label": "inkl. moms",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Bokningsnummer",
    "reservation_id": "12",
}


RESERVATION_MANAGE_LINK_CONTEXT_EN = {
    "manage_reservation": (
        "Manage your booking at Varaamo. "
        "You can check the details of your booking and Varaamo's terms of contract and cancellation on the "
        "'My bookings' page: https://fake.varaamo.hel.fi/en/reservations."
    ),
    "manage_reservation_html": (
        "Manage your booking at Varaamo. "
        "You can check the details of your booking and Varaamo's terms of contract and cancellation on the "
        '<a href="https://fake.varaamo.hel.fi/en/reservations">'
        "'My bookings' page</a>."
    ),
}
RESERVATION_MANAGE_LINK_CONTEXT_FI = {
    "manage_reservation": (
        "Hallitse varaustasi Varaamossa. "
        "Voit perua varauksesi ja tarkistaa varauksen tiedot sekä Varaamon sopimus- ja peruutusehdot "
        "'Omat Varaukset' -sivulla: https://fake.varaamo.hel.fi/reservations."
    ),
    "manage_reservation_html": (
        "Hallitse varaustasi Varaamossa. "
        "Voit perua varauksesi ja tarkistaa varauksen tiedot sekä Varaamon sopimus- ja peruutusehdot "
        '<a href="https://fake.varaamo.hel.fi/reservations">'
        "'Omat Varaukset' -sivulla</a>."
    ),
}
RESERVATION_MANAGE_LINK_CONTEXT_SV = {
    "manage_reservation": (
        "Hantera din bokning på Varaamo. "
        "Du kan kontrollera uppgifterna om din bokning samt Varaamos avtals- och avbokningsvillkor "
        "på sidan 'Mina bokningar': https://fake.varaamo.hel.fi/sv/reservations."
    ),
    "manage_reservation_html": (
        "Hantera din bokning på Varaamo. "
        "Du kan kontrollera uppgifterna om din bokning samt Varaamos avtals- och avbokningsvillkor på sidan "
        '<a href="https://fake.varaamo.hel.fi/sv/reservations">'
        "'Mina bokningar'</a>."
    ),
}


SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_EN = {
    "check_booking_details_text": "You can check your booking details at",
    "check_booking_details_url": "https://fake.varaamo.hel.fi/en/applications",
    "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/en/applications">varaamo.hel.fi</a>',
}
SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI = {
    "check_booking_details_text": "Voit käydä tarkistamassa varauksesi tiedot osoitteessa",
    "check_booking_details_url": "https://fake.varaamo.hel.fi/applications",
    "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/applications">varaamo.hel.fi</a>',
}
SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV = {
    "check_booking_details_text": "Du kan kontrollera dina bokningsuppgifter på",
    "check_booking_details_url": "https://fake.varaamo.hel.fi/sv/applications",
    "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/sv/applications">varaamo.hel.fi</a>',
}
