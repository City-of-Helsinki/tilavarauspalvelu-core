# ruff: noqa: E501
from config.utils.commons import LanguageType

EMAIL_TRANSLATIONS: dict[str, dict[LanguageType, str]] = {
    "subjectReservationConfirmed": {
        "fi": "Varauksesi on vahvistettu",
        "en": "Thank you for your booking at Varaamo",
        "sv": "Din bokning är bekräftad",
    },
    "subjectReservationHandlingRequired": {
        "fi": "Varauksesi odottaa käsittelyä",
        "en": "Your booking is waiting for processing",
        "sv": "Din bokning väntar på att behandlas",
    },
    "subjectReservationHandledConfirmed": {
        "fi": "Varauksesi on vahvistettu",
        "en": "Your booking is confirmed",
        "sv": "Din bokning är bekräftad",
    },
    "subjectReservationCancelled": {
        "fi": "Varauksesi on peruttu",
        "en": "Your booking has been cancelled",
        "sv": "Din bokning har avbokats",
    },
    "subjectReservationRejected": {
        "fi": "Valitettavasti varaustasi ei voida vahvistaa",
        "en": "Unfortunately your booking cannot be confirmed",
        "sv": "Tyvärr kan vi inte bekräfta din bokning",
    },
    "subjectReservationModified": {
        "fi": "Varaustasi on muutettu",
        "en": "Your booking has been updated",
        "sv": "Din bokning har uppdaterats",
    },
    "subjectStaffReservationMade": {
        "fi": "Toimipisteeseen {{unit_name}} on tehty uusi tilavaraus {{reservation_number}}",
        "en": "New booking {{reservation_number}} has been made for {{unit_name}}",
        "sv": "Ny bokning {{reservation_number}} har gjorts för {{unit_name}}",
    },
    "subjectStaffReservationRequiresHandling": {
        "fi": "Uusi tilavaraus {{reservation_number}} odottaa käsittelyä toimipisteessä {{unit_name}}",
        "en": "New booking {{reservation_number}} requires handling at unit {{unit_name}}",
        "sv": "Ny bokningsförfrågan {{reservation_number}} för {{reservation_unit}} väntar på at behandlats",
    },
    #
    "serviceName": {
        "fi": "Varaamo",
        "en": "Varaamo",
        "sv": "Varaamo",
    },
    "serviceUrl": {
        "fi": "varaamo.hel.fi",
        "en": "varaamo.hel.fi/en/",
        "sv": "varaamo.hel.fi/sv/",
    },
    "helsinkiCity": {
        "fi": "Helsingin kaupunki",
        "en": "City of Helsinki",
        "sv": "Helsingfors stad",
    },
    "salutation": {
        "fi": "Hei",
        "en": "Hi",
        "sv": "Hej",
    },
    "oClock": {
        "fi": "klo",
        "en": "at",
        "sv": "kl.",
    },
    #
    "vatIncluded": {
        "fi": "sis. alv",
        "en": "incl. VAT",
        "sv": "inkl. moms",
    },
    "paymentDue": {
        "fi": "Eräpäivä",
        "en": "Due date",
        "sv": "Förfallodatum",
    },
    "payReservation": {
        "fi": "Maksa varaus",
        "en": "Pay the booking",
        "sv": "Betala bokningen",
    },
    #
    "manageReservation": {
        "fi": "Hallitse varaustasi Varaamossa. Voit perua varauksesi ja tarkistaa varauksen tiedot sekä Varaamon sopimus- ja peruutusehdot",
        "en": "Manage your booking at Varaamo. You can check the details of your booking and Varaamo's terms of contract and cancellation on the",
        "sv": "Hantera din bokning på Varaamo. Du kan kontrollera uppgifterna om din bokning samt Varaamos avtals- och avbokningsvillkor på sidan",
    },
    "ownReservationsPage": {
        "fi": "Omat Varaukset -sivulla",
        "en": "'My bookings' page",
        "sv": "”Mina bokningar”",
    },
    "thankYouForUsing": {
        "fi": "Kiitos, kun käytit Varaamoa!",
        "en": "Thank you for choosing Varaamo!",
        "sv": "Tack för att du använder Varaamo!",
    },
    #
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
    #
    "textReservationConfirmed": {
        "fi": "Olet tehnyt uuden varauksen:",
        "en": "You have made a new booking:",
        "sv": "Du har gjort en ny bokning:",
    },
    "textReservationHandlingRequired": {
        "fi": "Olet tehnyt alustavan varauksen:",
        "en": "You have made a new booking request:",
        "sv": "Du har gjort en ny bokningsförfrågan:",
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
    "textReservationNeedsToBePaid": {
        "fi": "Varauksesi on hyväksytty, ja sen voi maksaa pankkitunnuksilla.",
        "en": "Your booking has been confirmed, and can be paid.",
        "sv": "Din bokning har bekräftats och kan betalas.",
    },
    "textReservationRejected": {
        "fi": "Valitettavasti alla olevaa varaustasi ei voida vahvistaa.",
        "en": "Unfortunately your booking cannot be confirmed.",
        "sv": "Tyvärr kan vi inte bekräfta din bokning.",
    },
    "textReservationModified": {
        "fi": "Varaustasi on muutettu:",
        "en": "Your booking has been updated:",
        "sv": "Din bokning har uppdaterats:",
    },
    "textReservationCancelled": {
        "fi": "Varauksesi on peruttu.",
        "en": "Your booking has been cancelled.",
        "sv": "Din bokning har avbokats.",
    },
    #
    "textReservationMade": {
        "fi": "Varausyksikköön {{reservation_unit}} on tehty uusi hyväksytty varaus",
        "en": "A new booking has been confirmed for {{reservation_unit}}",
        "sv": "En ny bokningsförfrågan för {{reservation_unit}} har bekräftats",
    },
    "textStaffReservationRequiresHandling": {
        "fi": "Varausyksikköön {{reservation_unit}} on tehty uusi käsittelyä vaativa varauspyyntö",
        "en": "A booking request for {{reservation_unit}} is waiting for processing",
        "sv": "En ny bokningsförfrågan för {{reservation_unit}} väntar på at behandlats",
    },
    "textStaffReservationMadeCheckDetails": {
        "fi": "Voit tarkistaa varauksen tiedot osoitteessa",
        "en": "You can view the booking at",
        "sv": "Du kan se bokningen på",
    },
    "staffReservationRequiresHandlingCheckDetails": {
        "fi": "Voit tarkistaa ja käsitellä varauksen osoitteessa",
        "en": "You can view and handle the booking at",
        "sv": "Du kan se bokningen på",
    },
    #
    "pendingNotification": {
        "fi": "Saat varausvahvistuksen sähköpostitse, kun varauksesi on käsitelty. Otamme sinuun yhteyttä, jos tarvitsemme lisätietoja varauspyyntöösi liittyen.",
        "en": "You will receive a confirmation email once your booking has been processed. We will contact you if further information is needed regarding your booking request.",
        "sv": "Du kommer att få en bekräftelse via e-post när din bokning har behandlats. Vi kommer att kontakta dig om ytterligare information behövs angående din bokningsförfrågan.",
    },
    "cancellationReason": {
        "fi": "Peruutuksen syy",
        "en": "Your reason for cancellation",
        "sv": "Din anledning till avbokning",
    },
    "rejectionReason": {
        "fi": "Syy",
        "en": "Reason",
        "sv": "Orsak",
    },
    "cancellationInstructions": {
        "fi": "Lisätietoa peruutuksesta",
        "en": "Additional information about cancellation",
        "sv": "Mer information om avbokning",
    },
    "rejectionInstructions": {
        "fi": "Lisätietoa",
        "en": "Additional information",
        "sv": "Mer information",
    },
    "reservationInstruction": {
        "fi": "Lisätietoa varauksestasi",
        "en": "Additional information about your booking",
        "sv": "Mer information om din bokning",
    },
    #
    "unit": {
        "fi": "Toimipiste",
        "en": "Unit",
        "sv": "Enheten",
    },
    "reserveeName": {
        "fi": "Varaajan nimi",
        "en": "Name",
        "sv": "Namn",
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
    "reservationPrice": {
        "fi": "Hinta",
        "en": "Price",
        "sv": "Pris",
    },
    "reservationNumber": {
        "fi": "Varausnumero",
        "en": "Reservation number",
        "sv": "Bokningsnummer",
    },
    #
    "subjectApplicationReceived": {
        "fi": "Hakemuksesi on vastaanotettu",
        "en": "subjectApplicationReceived EN",
        "sv": "subjectApplicationReceived SV",
    },
    "subjectApplicationInAllocation": {
        "fi": "Hakemuksesi on käsiteltävänä",
        "en": "subjectApplicationInAllocation EN",
        "sv": "subjectApplicationInAllocation SV",
    },
    "subjectApplicationHandled": {
        "fi": "Hakemuksesi on käsitelty",
        "en": "subjectApplicationHandled EN",
        "sv": "subjectApplicationHandled SV",
    },
    "applicationReceived": {
        "fi": "Kiitos hakemuksestasi.",
        "en": "applicationReceived EN",
        "sv": "applicationReceived SVAAAAAAAA",
    },
    "applicationInAllocation": {
        "fi": "Hakuaika on päättynyt. Ilmoitamme käsittelyn tuloksesta, kun hakemuksesi on käsitelty.",
        "en": "applicationInAllocation EN",
        "sv": "applicationInAllocation SV",
    },
    "applicationHandled": {
        "fi": "Näet tiedon käsittelyn tuloksesta",
        "en": "applicationHandled EN",
        "sv": "applicationHandled SV",
    },
    "manageApplication": {
        "fi": "Voit muuttaa tai täydentää hakemustasi",
        "en": "manageApplication EN",
        "sv": "manageApplication SV",
    },
    "viewApplication": {
        "fi": "Voit tarkastella lähettämääsi hakemusta",
        "en": "viewApplication EN",
        "sv": "viewApplication SV",
    },
    "ownApplicationPage": {
        "fi": "Omat hakemukset -sivulla",
        "en": "ownApplicationPage EN",
        "sv": "ownApplicationPage SV",
    },
    "untilApplicationPeriodEnd": {
        "fi": "hakuajan päättymiseen asti",
        "en": "untilApplicationPeriodEnd EN",
        "sv": "untilApplicationPeriodEnd SV",
    },
}
