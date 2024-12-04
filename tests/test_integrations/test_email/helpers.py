from __future__ import annotations

from decimal import Decimal

BASE_TEMPLATE_CONTEXT_EN = {
    "current_year": "2024",
    "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
    "helsinki_city": "City of Helsinki",
    "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
    "salutation": "Hi",
    "service_name": "Varaamo",
}
BASE_TEMPLATE_CONTEXT_FI = {
    "current_year": "2024",
    "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
    "helsinki_city": "Helsingin kaupunki",
    "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
    "salutation": "Hei",
    "service_name": "Varaamo",
}
BASE_TEMPLATE_CONTEXT_SV = {
    "current_year": "2024",
    "font_src": "https://makasiini.hel.ninja/delivery/HelsinkiGrotesk/565d73a693abe0776c801607ac28f0bf.woff",
    "helsinki_city": "Helsingfors stad",
    "helsinki_logo_url": "https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png",
    "salutation": "Hej",
    "service_name": "Varaamo",
}

CLOSING_CONTEXT_EN = {
    "service_name": "Varaamo",
    "with_regards": "Kind regards",
}
CLOSING_CONTEXT_FI = {
    "service_name": "Varaamo",
    "with_regards": "Ystävällisin terveisin",
}
CLOSING_CONTEXT_SV = {
    "service_name": "Varaamo",
    "with_regards": "Med vänliga hälsningar",
}

CLOSING_POLITE_CONTEXT_FI = CLOSING_CONTEXT_FI | {
    "thank_you_for_using": "Kiitos, kun käytit Varaamoa!",
}
CLOSING_POLITE_CONTEXT_EN = CLOSING_CONTEXT_EN | {
    "thank_you_for_using": "Thank you for choosing Varaamo!",
}
CLOSING_POLITE_CONTEXT_SV = CLOSING_CONTEXT_SV | {
    "thank_you_for_using": "Tack för att du använder Varaamo!",
}

CLOSING_STAFF_CONTEXT_EN = {
    "automatic_message_do_not_reply": "This is an automated message, please do not reply",
    "service_name": "Varaamo",
    "with_regards": "Kind regards",
}
CLOSING_STAFF_CONTEXT_FI = {
    "automatic_message_do_not_reply": "Tämä on automaattinen viesti, johon ei voi vastata",
    "service_name": "Varaamo",
    "with_regards": "Ystävällisin terveisin",
}
CLOSING_STAFF_CONTEXT_SV = {
    "automatic_message_do_not_reply": "Detta är ett automatiskt meddelande som inte kan besvaras",
    "service_name": "Varaamo",
    "with_regards": "Med vänliga hälsningar",
}

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

RESERVATION_BASIC_INFO_CONTEXT_EN = {
    "reservation_unit_name": "Test reservation unit",
    "unit_name": "Test unit",
    "unit_location": "Test location",
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
    "unit_location": "Test location",
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
    "unit_location": "Test location",
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
    "vat_included_label": "incl. VAT",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Booking number",
    "reservation_id": "12",
}
RESERVATION_PRICE_INFO_CONTEXT_FI = {
    "price_label": "Hinta",
    "price": Decimal("12.30"),
    "vat_included_label": "sis. alv",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Varausnumero",
    "reservation_id": "12",
}
RESERVATION_PRICE_INFO_CONTEXT_SV = {
    "price_label": "Pris",
    "price": Decimal("12.30"),
    "vat_included_label": "inkl. moms",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Bokningsnummer",
    "reservation_id": "12",
}

RESERVATION_PRICE_RANGE_INFO_CONTEXT_EN = {
    "price_label": "Price",
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "vat_included_label": "incl. VAT",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Booking number",
    "reservation_id": "12",
}
RESERVATION_PRICE_RANGE_INFO_CONTEXT_FI = {
    "price_label": "Hinta",
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "vat_included_label": "sis. alv",
    "tax_percentage": Decimal("25.5"),
    "booking_number_label": "Varausnumero",
    "reservation_id": "12",
}
RESERVATION_PRICE_RANGE_INFO_CONTEXT_SV = {
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
    "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/en/applications">https://fake.varaamo.hel.fi/en/applications</a>',
}
SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_FI = {
    "check_booking_details_text": "Voit käydä tarkistamassa varauksesi tiedot osoitteessa",
    "check_booking_details_url": "https://fake.varaamo.hel.fi/applications",
    "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/applications">https://fake.varaamo.hel.fi/applications</a>',
}
SEASONAL_RESERVATION_CHECK_BOOKING_DETAILS_LINK_SV = {
    "check_booking_details_text": "Du kan kontrollera dina bokningsuppgifter på",
    "check_booking_details_url": "https://fake.varaamo.hel.fi/sv/applications",
    "check_booking_details_url_html": '<a href="https://fake.varaamo.hel.fi/sv/applications">https://fake.varaamo.hel.fi/sv/applications</a>',
}
