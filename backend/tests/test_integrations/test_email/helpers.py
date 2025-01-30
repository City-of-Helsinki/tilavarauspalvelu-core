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
    "booking_number_label": "Booking number",
    "reservee_name_label": "Reservee name",
    "instructions_booking_label": "Additional information about your booking",
    "instructions_cancelled_label": "Additional information about cancellation",
    "instructions_rejected_label": "Additional information",
    "weekday_label": "Day",
    "time_label": "Time",
    "text_view_booking_at": "You can view the booking at",
    "text_view_and_handle_at": "You can view and handle the booking at",
    "text_reservation_cancelled": "Your booking has been cancelled",
    "text_seasonal_reservation_cancelled": "The space reservation included in your seasonal booking has been cancelled",
}
RESERVATION_TRANSLATIONS_CONTEXT_FI = {
    "booking_number_label": "Varausnumero",
    "reservee_name_label": "Varaajan nimi",
    "instructions_booking_label": "Lisätietoa varauksestasi",
    "instructions_cancelled_label": "Lisätietoa peruutuksesta",
    "instructions_rejected_label": "Lisätietoa",
    "weekday_label": "Päivä",
    "time_label": "Kellonaika",
    "text_view_booking_at": "Voit tarkistaa varauksen tiedot osoitteessa",
    "text_view_and_handle_at": "Voit tarkistaa ja käsitellä varauksen osoitteessa",
    "text_reservation_cancelled": "Varauksesi on peruttu",
    "text_seasonal_reservation_cancelled": "Kausivaraukseesi kuuluva tilavaraus on peruttu",
}
RESERVATION_TRANSLATIONS_CONTEXT_SV = {
    "booking_number_label": "Bokningsnummer",
    "reservee_name_label": "Bokare",
    "instructions_booking_label": "Mer information om din bokning",
    "instructions_cancelled_label": "Mer information om avbokning",
    "instructions_rejected_label": "Mer information",
    "weekday_label": "Dag",
    "time_label": "Tid",
    "text_view_booking_at": "Du kan se bokningen på",
    "text_view_and_handle_at": "Du kan se bokningen på",
    "text_reservation_cancelled": "Din bokning har avbokats",
    "text_seasonal_reservation_cancelled": "Lokalbokningen som ingår i din säsongsbokning har avbokats",
}

APPLICATION_TRANSLATIONS_CONTEXT_EN = {
    "seasonal_booking_label": "Seasonal Booking",
    "view_booking_at_label": "You can view the booking at",
    "text_seasonal_cancelled_by_staff": "All space reservations included in your seasonal booking have been cancelled",
    "text_seasonal_cancelled_by_customer": (
        "The customer has canceled all space reservations included in the seasonal booking"
    ),
}
APPLICATION_TRANSLATIONS_CONTEXT_FI = {
    "seasonal_booking_label": "Kausivaraus",
    "view_booking_at_label": "Voit tarkistaa varauksen tiedot osoitteessa",
    "text_seasonal_cancelled_by_staff": "Kaikki kausivaraukseesi kuuluvat tilavaraukset on peruttu",
    "text_seasonal_cancelled_by_customer": "Asiakas on perunut kaikki kausivaraukseen kuuluvat tilavaraukset",
}
APPLICATION_TRANSLATIONS_CONTEXT_SV = {
    "seasonal_booking_label": "Säsongsbokning",
    "view_booking_at_label": "Du kan se bokningen på",
    "text_seasonal_cancelled_by_staff": "Alla lokalbokningar som ingår i din säsongsbokning har avbokats",
    "text_seasonal_cancelled_by_customer": "Kunden har avbokat alla lokalbokningar som ingår i säsongsbokningen",
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
        "reason_label": "Reason",
        "reason_cancel_label": "Your reason for cancellation",
    }
    | AUTOMATIC_REPLY_CONTEXT_EN
    | RESERVATION_TRANSLATIONS_CONTEXT_EN
    | APPLICATION_TRANSLATIONS_CONTEXT_EN
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
        "reason_label": "Syy",
        "reason_cancel_label": "Peruutuksen syy",
    }
    | AUTOMATIC_REPLY_CONTEXT_FI
    | RESERVATION_TRANSLATIONS_CONTEXT_FI
    | APPLICATION_TRANSLATIONS_CONTEXT_FI
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
        "reason_label": "Orsak",
        "reason_cancel_label": "Din anledning till avbokning",
    }
    | AUTOMATIC_REPLY_CONTEXT_SV
    | RESERVATION_TRANSLATIONS_CONTEXT_SV
    | APPLICATION_TRANSLATIONS_CONTEXT_SV
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


_RESERVATION_PRICE_INFO_CONTEXT_COMMON = {
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "tax_percentage": Decimal("25.5"),
    "reservation_id": "12",
}
RESERVATION_PRICE_INFO_CONTEXT_EN = _RESERVATION_PRICE_INFO_CONTEXT_COMMON | {
    "price_label": "Price",
    "vat_included_label": "incl. VAT",
}
RESERVATION_PRICE_INFO_CONTEXT_FI = _RESERVATION_PRICE_INFO_CONTEXT_COMMON | {
    "price_label": "Hinta",
    "vat_included_label": "sis. alv",
}
RESERVATION_PRICE_INFO_CONTEXT_SV = _RESERVATION_PRICE_INFO_CONTEXT_COMMON | {
    "price_label": "Pris",
    "vat_included_label": "inkl. moms",
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
