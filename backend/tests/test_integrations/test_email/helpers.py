from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from utils.utils import html_2_text

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection


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


def get_application_details_urls(section: ApplicationSection) -> dict[str, str]:
    details_url = (
        f"https://fake.varaamo.hel.fi/en/applications/{section.application_id}/view"
        f"?tab=reservations&section={section.id}"
    )
    return {
        "check_booking_details_url": f"{details_url}",
        "check_booking_details_url_html": f'<a href="{details_url}">varaamo.hel.fi</a>',
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

KEYLESS_ENTRY_ACCESS_CODE_IS_USED_CONTEXT = {
    "access_code_is_used": True,
    "access_code": "123456",
    "access_code_validity_period": "11:00-15:00",
}

KEYLESS_ENTRY_CONTEXT_EN = {
    "access_code_is_used": False,
    "access_code": "",
    "access_code_validity_period": "",
    "access_code_label": "Door code",
    "access_code_validity_period_label": "Validity period of the door code",
    "text_access_code_to_access": "You can access the space with the door code",
    "text_access_code_confirmed": "Here are your booking details and the door code for easy access to the space",
    "text_access_code_unavailable_instructions_html": (
        "You can see the door code on the "
        "<a href=\"https://fake.varaamo.hel.fi/en/reservations\">'My bookings' page</a> at Varaamo. "
        "If the code is not visible in your booking details, please contact "
        '<a href="https://fake.varaamo.hel.fi/feedback?lang=en">Varaamo customer service</a>.'
    ),
    "text_access_code_unavailable_instructions": (
        "You can see the door code on the https://fake.varaamo.hel.fi/en/reservations: 'My bookings' page at Varaamo. "
        "If the code is not visible in your booking details, please contact "
        "https://fake.varaamo.hel.fi/feedback?lang=en: Varaamo customer service."
    ),
}
KEYLESS_ENTRY_CONTEXT_FI = {
    "access_code_is_used": False,
    "access_code": "",
    "access_code_validity_period": "",
    "access_code_label": "Ovikoodi",
    "access_code_validity_period_label": "Ovikoodin voimassaoloaika",
    "text_access_code_to_access": "Pääset tilaan sisään ovikoodilla",
    "text_access_code_confirmed": "Tässä ovat varauksesi tiedot ja ovikoodi, jolla pääset tilaan helposti",
    "text_access_code_unavailable_instructions_html": (
        "Näet ovikoodin Varaamon "
        "<a href=\"https://fake.varaamo.hel.fi/reservations\">'Omat Varaukset' -sivulla</a>. "
        "Jos koodi ei ole näkyvissä varauksesi tiedoissa, ota yhteyttä "
        '<a href="https://fake.varaamo.hel.fi/feedback?lang=fi">Varaamon asiakaspalveluun</a>.'
    ),
    "text_access_code_unavailable_instructions": (
        "Näet ovikoodin Varaamon https://fake.varaamo.hel.fi/reservations: 'Omat Varaukset' -sivulla. "
        "Jos koodi ei ole näkyvissä varauksesi tiedoissa, ota yhteyttä "
        "https://fake.varaamo.hel.fi/feedback?lang=fi: Varaamon asiakaspalveluun."
    ),
}
KEYLESS_ENTRY_CONTEXT_SV = {
    "access_code_is_used": False,
    "access_code": "",
    "access_code_validity_period": "",
    "access_code_label": "Dörrkod",
    "access_code_validity_period_label": "Dörrkodens giltighetstid",
    "text_access_code_to_access": "Du kan komma in i utrymmet med dörrkoden",
    "text_access_code_confirmed": "Här är dina bokningsuppgifter och dörrkoden för enkel åtkomst till utrymmet",
    "text_access_code_unavailable_instructions_html": (
        "Du kan se dörrkoden på <a href=\"https://fake.varaamo.hel.fi/sv/reservations\">'Mina bokningar'</a> i Varaamo."
        " Om koden inte syns i dina bokningsuppgifter, vänligen kontakta "
        '<a href="https://fake.varaamo.hel.fi/feedback?lang=sv">Varaamo kundtjänst</a>.'
    ),
    "text_access_code_unavailable_instructions": (
        "Du kan se dörrkoden på https://fake.varaamo.hel.fi/sv/reservations: 'Mina bokningar' i Varaamo. "
        "Om koden inte syns i dina bokningsuppgifter, vänligen kontakta "
        "https://fake.varaamo.hel.fi/feedback?lang=sv: Varaamo kundtjänst."
    ),
}


RESERVATION_BASIC_INFO_CONTEXT_COMMON = {
    "reservation_unit_name": "[VARAUSYKSIKÖN NIMI]",
    "unit_name": "[TOIMIPISTEEN NIMI]",
    "unit_location": "[TOIMIPISTEEN OSOITE], [KAUPUNKI]",
    "begin_date": "1.1.2024",
    "begin_time": "12:00",
    "end_date": "1.1.2024",
    "end_time": "15:00",
}
RESERVATION_BASIC_INFO_CONTEXT_EN = {
    **RESERVATION_BASIC_INFO_CONTEXT_COMMON,
    "begins_label": "From",
    "ends_label": "To",
    "o_clock_label": "at",
}
RESERVATION_BASIC_INFO_CONTEXT_FI = {
    **RESERVATION_BASIC_INFO_CONTEXT_COMMON,
    "begins_label": "Alkamisaika",
    "ends_label": "Päättymisaika",
    "o_clock_label": "klo",
}
RESERVATION_BASIC_INFO_CONTEXT_SV = {
    **RESERVATION_BASIC_INFO_CONTEXT_COMMON,
    "begins_label": "Börjar",
    "ends_label": "Slutar",
    "o_clock_label": "kl.",
}


_RESERVATION_PRICE_INFO_CONTEXT_COMMON = {
    "price": Decimal("12.30"),
    "subsidised_price": Decimal("12.30"),
    "price_can_be_subsidised": False,
    "tax_percentage": Decimal("25.5"),
    "reservation_id": "1234",
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


EMAIL_LOGO_HTML = """![](https://makasiini.hel.ninja/helsinki-logos/helsinki-logo-black.png)

        **Varaamo**"""

MANAGE_RESERVATIONS_LINK_TEXT_EN = (
    "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract "
    "and cancellation on the 'My bookings' page: https://fake.varaamo.hel.fi/en/reservations."
)
MANAGE_RESERVATIONS_LINK_HTML_EN = (
    "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract "
    "and cancellation on the ['My bookings' page](https://fake.varaamo.hel.fi/en/reservations)."
)

EMAIL_CLOSING_TEXT_EN = """Kind regards
        Varaamo

        This is an automated message, please do not reply. Contact us: https://fake.varaamo.hel.fi/feedback?lang=en.

        Book the city's premises and equipment for your use at https://fake.varaamo.hel.fi/en.
"""

EMAIL_CLOSING_HTML_EN = f"""Kind regards
        Varaamo
        This is an automated message, please do not reply.
        [Contact us](https://fake.varaamo.hel.fi/feedback?lang=en).
        Book the city's premises and equipment for your use at [varaamo.hel.fi](https://fake.varaamo.hel.fi/en).

        {EMAIL_LOGO_HTML}

        (C) City of Helsinki 2024
"""
