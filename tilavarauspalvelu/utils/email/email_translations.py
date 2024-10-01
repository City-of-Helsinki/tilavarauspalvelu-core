# ruff: noqa: RUF001
from config.utils.commons import LanguageType

EMAIL_TRANSLATIONS: dict[str, dict[LanguageType, str]] = {
    # APPLICATION_HANDLED
    "subjectApplicationHandled": {
        "fi": "Hakemuksesi on käsitelty",
        "en": "Your application has been processed",
        "sv": "Din ansökan har behandlats",
    },
    "applicationHandled": {
        "fi": "Näet tiedon käsittelyn tuloksesta",
        "en": "You can view the result of the processing on the",
        "sv": "Du kan se resultatet av behandlingen på sidan",
    },
    #
    # APPLICATION_IN_ALLOCATION
    "subjectApplicationInAllocation": {
        "fi": "Hakemuksesi on käsiteltävänä",
        "en": "You application is being processed",
        "sv": "Din ansökan behandlas",
    },
    "applicationInAllocation": {
        "fi": "Hakuaika on päättynyt. Ilmoitamme käsittelyn tuloksesta, kun hakemuksesi on käsitelty.",
        "en": (
            "The application deadline has passed. "
            "We will notify you of the result when your application has been processed."
        ),
        "sv": (
            "Ansökningstiden har löpt ut. "
            "Vi skickar ett meddelande till e-postadressen när din ansökan har behandlats."
        ),
    },
    "viewApplication": {
        "fi": "Voit tarkastella lähettämääsi hakemusta",
        "en": "You can view the application you have sent on the",
        "sv": "Du kan se den ansökan du har skickat på sidan",
    },
    #
    # APPLICATION_RECEIVED
    "subjectApplicationReceived": {
        "fi": "Hakemuksesi on vastaanotettu",
        "en": "Your application has been received",
        "sv": "Din ansökan har mottagits",
    },
    "applicationReceived": {
        "fi": "Kiitos hakemuksestasi.",
        "en": "Thank you for your application.",
        "sv": "Tack för din ansökan.",
    },
    "manageApplication": {
        "fi": "Voit muokata hakemustasi",
        "en": "You can edit your application on the",
        "sv": "Du kan redigera din ansökan på sidan",
    },
    "untilApplicationPeriodEnd": {
        "fi": "hakuajan päättymiseen asti",
        "en": "until the application deadline",
        "sv": "till och med ansökningstidens utgång",
    },
    #
    # RESERVATION_CANCELLED
    "subjectReservationCancelled": {
        "fi": "Varauksesi on peruttu",
        "en": "Your booking has been cancelled",
        "sv": "Din bokning har avbokats",
    },
    "textReservationCancelled": {
        "fi": "Varauksesi on peruttu.",
        "en": "Your booking has been cancelled.",
        "sv": "Din bokning har avbokats.",
    },
    "cancellationReason": {
        "fi": "Peruutuksen syy",
        "en": "Your reason for cancellation",
        "sv": "Din anledning till avbokning",
    },
    "cancellationInstructions": {
        "fi": "Lisätietoa peruutuksesta",
        "en": "Additional information about cancellation",
        "sv": "Mer information om avbokning",
    },
    #
    # RESERVATION_CONFIRMED
    "subjectReservationConfirmed": {
        "fi": "Kiitos varauksestasi Varaamossa",
        "en": "Thank you for your booking at Varaamo",
        "sv": "Tack för din bokning på Varaamo",
    },
    "textReservationConfirmed": {
        "fi": "Olet tehnyt uuden varauksen:",
        "en": "You have made a new booking:",
        "sv": "Du har gjort en ny bokning:",
    },
    #
    # RESERVATION_HANDLED_AND_CONFIRMED
    "subjectReservationHandledConfirmed": {
        "fi": "Varauksesi on vahvistettu",
        "en": "Your booking is confirmed",
        "sv": "Din bokning är bekräftad",
    },
    "textReservationHandledConfirmed": {
        "fi": "Varauksesi on nyt vahvistettu.",
        "en": "Your booking is now confirmed.",
        "sv": "Din bokning har bekräftats.",
    },
    "textReservationHandledConfirmedSubsidized": {
        "fi": "Varauksesi on hyväksytty, ja varaukseen on myönnetty seuraava alennus:",
        "en": "Your booking has been confirmed with the following discount:",
        "sv": "Din bokning har bekräftats med följande rabatt:",
    },
    #
    # RESERVATION_HANDLING_REQUIRED
    "subjectReservationHandlingRequired": {
        "fi": "Varauksesi odottaa käsittelyä",
        "en": "Your booking is waiting for processing",
        "sv": "Din bokning väntar på att behandlas",
    },
    "textReservationHandlingRequired": {
        "fi": "Olet tehnyt alustavan varauksen:",
        "en": "You have made a new booking request:",
        "sv": "Du har gjort en ny bokningsförfrågan:",
    },
    "pendingNotification": {
        "fi": (
            "Saat varausvahvistuksen sähköpostitse, kun varauksesi on käsitelty. "
            "Otamme sinuun yhteyttä, jos tarvitsemme lisätietoja varauspyyntöösi liittyen."
        ),
        "en": (
            "You will receive a confirmation email once your booking has been processed. "
            "We will contact you if further information is needed regarding your booking request."
        ),
        "sv": (
            "Du kommer att få en bekräftelse via e-post när din bokning har behandlats. "
            "Vi kommer att kontakta dig om ytterligare information behövs angående din bokningsförfrågan."
        ),
    },
    #
    # RESERVATION_MODIFIED
    "subjectReservationModified": {
        "fi": "Varaustasi on muutettu",
        "en": "Your booking has been updated",
        "sv": "Din bokning har uppdaterats",
    },
    "textReservationModified": {
        "fi": "Varaustasi on muutettu:",
        "en": "Your booking has been updated:",
        "sv": "Din bokning har uppdaterats:",
    },
    #
    # RESERVATION_NEEDS_TO_BE_PAID
    "textReservationNeedsToBePaid": {
        "fi": "Varauksesi on hyväksytty, ja sen voi maksaa pankkitunnuksilla.",
        "en": "Your booking has been confirmed, and can be paid.",
        "sv": "Din bokning har bekräftats och kan betalas.",
    },
    "payReservation": {
        "fi": "Maksa varaus",
        "en": "Pay the booking",
        "sv": "Betala bokningen",
    },
    "paymentDue": {
        "fi": "Eräpäivä",
        "en": "Due date",
        "sv": "Förfallodatum",
    },
    #
    # RESERVATION_REJECTED
    "subjectReservationRejected": {
        "fi": "Valitettavasti varaustasi ei voida vahvistaa",
        "en": "Unfortunately your booking cannot be confirmed",
        "sv": "Tyvärr kan vi inte bekräfta din bokning",
    },
    "textReservationRejected": {
        "fi": "Valitettavasti alla olevaa varaustasi ei voida vahvistaa.",
        "en": "Unfortunately your booking cannot be confirmed.",
        "sv": "Tyvärr kan vi inte bekräfta din bokning.",
    },
    "rejectionInstructions": {
        "fi": "Lisätietoa",
        "en": "Additional information",
        "sv": "Mer information",
    },
    "rejectionReason": {
        "fi": "Syy",
        "en": "Reason",
        "sv": "Orsak",
    },
    #
    # STAFF_NOTIFICATION_RESERVATION_MADE
    "subjectStaffReservationMade": {
        "fi": "Toimipisteeseen {{unit_name}} on tehty uusi tilavaraus {{reservation_number}}",
        "en": "New booking {{reservation_number}} has been made for {{unit_name}}",
        "sv": "Ny bokning {{reservation_number}} har gjorts för {{unit_name}}",
    },
    "textStaffReservationMadeCheckDetails": {
        "fi": "Voit tarkistaa varauksen tiedot osoitteessa",
        "en": "You can view the booking at",
        "sv": "Du kan se bokningen på",
    },
    "textStaffReservationMade": {
        "fi": "Varausyksikköön {{reservation_unit}} on tehty uusi hyväksytty varaus",
        "en": "A new booking has been confirmed for {{reservation_unit}}",
        "sv": "En ny bokningsförfrågan för {{reservation_unit}} har bekräftats",
    },
    #
    # STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING
    "subjectStaffReservationRequiresHandling": {
        "fi": "Uusi tilavaraus {{reservation_number}} odottaa käsittelyä toimipisteessä {{unit_name}}",
        "en": "New booking {{reservation_number}} requires handling at unit {{unit_name}}",
        "sv": "Ny bokningsförfrågan {{reservation_number}} för {{reservation_unit}} väntar på at behandlats",
    },
    "textStaffReservationRequiresHandling": {
        "fi": "Varausyksikköön {{reservation_unit}} on tehty uusi käsittelyä vaativa varauspyyntö",
        "en": "A booking request for {{reservation_unit}} is waiting for processing",
        "sv": "En ny bokningsförfrågan för {{reservation_unit}} väntar på at behandlats",
    },
    "staffReservationRequiresHandlingCheckDetails": {
        "fi": "Voit tarkistaa ja käsitellä varauksen osoitteessa",
        "en": "You can view and handle the booking at",
        "sv": "Du kan se bokningen på",
    },
    #
    # Reservation common translations
    "reserveeName": {
        "fi": "Varaajan nimi",
        "en": "Name",
        "sv": "Namn",
    },
    "reservationNumber": {
        "fi": "Varausnumero",
        "en": "Booking number",
        "sv": "Bokningsnummer",
    },
    "reservationBegins": {
        "fi": "Alkamisaika",
        "en": "From",
        "sv": "Börjar",
    },
    "reservationEnds": {
        "fi": "Päättymisaika",
        "en": "To",
        "sv": "Slutar",
    },
    "oClock": {
        "fi": "klo",
        "en": "at",
        "sv": "kl.",
    },
    "reservationPrice": {
        "fi": "Hinta",
        "en": "Price",
        "sv": "Pris",
    },
    "vatIncluded": {
        "fi": "sis. alv",
        "en": "incl. VAT",
        "sv": "inkl. moms",
    },
    "manageReservation": {
        "fi": (
            "Hallitse varaustasi Varaamossa. "
            "Voit perua varauksesi ja tarkistaa varauksen tiedot sekä Varaamon sopimus- ja peruutusehdot"
        ),
        "en": (
            "Manage your booking at Varaamo. "
            "You can check the details of your booking and Varaamo's terms of contract and cancellation on the"
        ),
        "sv": (
            "Hantera din bokning på Varaamo. "
            "Du kan kontrollera uppgifterna om din bokning samt Varaamos avtals- och avbokningsvillkor på sidan"
        ),
    },
    "ownReservationsPage": {
        "fi": "Omat Varaukset -sivulla",
        "en": "‘My bookings’ page",
        "sv": "‘Mina bokningar’",
    },
    "reservationInstruction": {
        "fi": "Lisätietoa varauksestasi",
        "en": "Additional information about your booking",
        "sv": "Mer information om din bokning",
    },
    #
    # Application common translations
    "ownApplicationPage": {
        "fi": "Omat hakemukset -sivulla",
        "en": "‘My applications’ page",
        "sv": "”Mina ansökningar”",
    },
    #
    # Header
    "salutation": {
        "fi": "Hei",
        "en": "Hi",
        "sv": "Hej",
    },
    #
    # Footer
    "helsinkiCity": {
        "fi": "Helsingin kaupunki",
        "en": "City of Helsinki",
        "sv": "Helsingfors stad",
    },
    #
    # Header / Footer / Closing
    "serviceName": {
        "fi": "Varaamo",
        "en": "Varaamo",
        "sv": "Varaamo",
    },
    #
    # Closing
    "thankYouForUsing": {
        "fi": "Kiitos, kun käytit Varaamoa!",
        "en": "Thank you for choosing Varaamo!",
        "sv": "Tack för att du använder Varaamo!",
    },
    "withRegards": {
        "fi": "Ystävällisin terveisin,",
        "en": "Kind regards",
        "sv": "Med vänliga hälsningar,",
    },
    "automaticMessageDoNotReply": {
        "fi": "Tämä on automaattinen viesti, johon ei voi vastata.",
        "en": "This is an automated message, please do not reply.",
        "sv": "Detta är ett automatiskt meddelande som inte kan besvaras.",
    },
    "contactUs": {
        "fi": "Ota yhteyttä",
        "en": "Contact us",
        "sv": "Ta kontakt",
    },
    "reserveCityResourcesAt": {
        "fi": "Varaa kaupungin tiloja ja laitteita käyttöösi helposti osoitteessa",
        "en": "Book the city's premises and equipment for your use at",
        "sv": "Boka enkelt stadens lokaler och utrustning för eget bruk på",
    },
    "serviceUrl": {
        "fi": "varaamo.hel.fi",
        "en": "varaamo.hel.fi/en/",
        "sv": "varaamo.hel.fi/sv/",
    },
}
