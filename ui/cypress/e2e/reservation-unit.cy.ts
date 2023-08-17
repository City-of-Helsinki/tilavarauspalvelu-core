import { toUIDate } from "common/src/common/util";
import { addDays, addHours, addMinutes, format } from "date-fns";
import {
  hzNavigationBack,
  hzNavigationFwd,
  reservationSubmitButton,
  timeColumn,
} from "../model/calendar";
import { error404Body, error404Title } from "../model/error";
import {
  errorNotificationBody,
  errorNotificationTitle,
} from "../model/notification";
import {
  dateSelect,
  durationSelect,
  nextAvailableTimeLink,
  price,
  submitButton,
  timeSlots,
} from "../model/quick-reservation";
import {
  cancelButton,
  dateSelector,
  reservationEvent,
  durationSelectorToggle,
  startTimeSelectorToggle,
  reservationStartNotification,
  calendarWrapper,
  reservationQuotaNotification,
  reserveeTypeSelector,
  datePickerModal,
} from "../model/reservation-creation";
import { reservationInfoCard } from "../model/reservation-detail";
import {
  addressContainer,
  description,
  equipment,
  paymentAndCancellationTerms,
  reservationControls,
  pricingTerms,
  reservationInfo,
  reservationNotice,
  termsOfUse,
  reservationControlsToggleButton,
  pricingTermsLink,
  pricingTermsDialog,
} from "../model/reservation-unit";
import { textWithIcon } from "../model/search";

const CYPRESS_TIMEOUT = 5000

const matchEvent = (): void => {
  reservationEvent()
    .find(".rbc-event-label")
    .invoke("text")
    .then((text) => {
      startTimeSelectorToggle()
        .invoke("text")
        .then((startTimeLabel) => {
          durationSelectorToggle()
            .invoke("text")
            .then((duration) => {
              const [hours, minutes] = startTimeLabel.split(".");
              const startTime = `${hours}:${minutes}`;
              const [durationHours, durationMinutes] = duration.split(":");
              const endTime = format(
                addMinutes(
                  addHours(
                    new Date().setHours(Number(hours), Number(minutes)),
                    Number(durationHours)
                  ),
                  Number(durationMinutes)
                ),
                "H:mm"
              );
              expect(text).to.eq(`${startTime}-${endTime}`);
            });
        });
    });
};

const reservationEnds = (date: Date, justDate = false) => {
  const fmt = justDate ? "d.M.yyyy" : "d.M.yyyy 'klo' H.mm";
  return format(addDays(date, 10), fmt);
};

const drawReservation = (): void => {
  hzNavigationFwd().click();

  reservationSubmitButton().should("not.exist");

  timeColumn(0).within(() => {
    const timeSlot = cy.get(".rbc-time-slot").eq(18);

    timeSlot
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 40, { force: true })
      .trigger("mouseup", { force: true, button: 0 });
  });

  reservationSubmitButton().should("exist");

  timeColumn(1).within(() => {
    const timeSlot = cy.get(".rbc-time-slot").eq(18);

    timeSlot
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 40, { force: true })
      .trigger("mouseup", { force: true, button: 0 });
  });

  durationSelectorToggle().should("not.exist");

  reservationControlsToggleButton().click();

  durationSelectorToggle().should("exist");

  durationSelectorToggle()
    .click()
    .siblings("ul")
    .children("li:nth-of-type(2)")
    .click();

  reservationSubmitButton().should("not.disabled");
  matchEvent();
};

Cypress.config("defaultCommandTimeout", CYPRESS_TIMEOUT);

describe("reservation", () => {
  beforeEach(() => {
    cy.visit("/reservation-unit/2");
    cy.injectAxe();
  });

  it("can cancel reservation process", () => {
    textWithIcon(1).contains("20 henkilö");

    drawReservation();

    cy.checkA11y(undefined, undefined, undefined, true);

    reservationSubmitButton().click();

    cy.checkA11y(undefined, undefined, undefined, true);

    cancelButton().click();

    hzNavigationBack().should("exist");

    cy.url().should("contain", "/reservation-unit/2");

    reservationEvent().should("not.exist");
  });

  it("can do the reservation with form inputs", () => {
    const today = format(new Date(), "d.M.yyyy");

    dateSelector().should("not.exist");

    reservationControlsToggleButton().click();

    dateSelector()
      .invoke("val")
      .then((value) => {
        expect(value).to.eq(today);
      });

    dateSelector()
      .parent()
      .find('button[aria-label="Valitse päivämäärä"]')
      .click();

    datePickerModal().should("exist");

    datePickerModal()
      .find('select[aria-label="Kuukausi"]')
      .invoke("val")
      .then((value) => {
        expect(value).to.eq(new Date().getMonth().toString());
      });

    const nextMonthBtn = datePickerModal().find(
      'button[aria-label="Seuraava kuukausi"]'
    );
    nextMonthBtn.should("exist");

    // const daysFromNow = (days: number): string =>
    //   format(addDays(new Date(), days), "d.M.yyyy");
    // dateSelector().clear().type(daysFromNow(9));

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(6)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // notificationContainer().contains(
    //   "Varaus on liian lähellä edellistä tai seuraavaa varausta. Muuta varauksen ajankohtaa."
    // );
    // notificationCloseButton().click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:first-of-type")
    //   .click();

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(6)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // notificationContainer().contains(
    //   "Varaus on liian lähellä edellistä tai seuraavaa varausta. Muuta varauksen ajankohtaa."
    // );
    // notificationCloseButton().click();

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(9)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // notificationContainer().contains(
    //   "Kohde on jo varattu valitsemanasi ajankohtana. Muuta varauksen ajankohtaa."
    // );
    // notificationCloseButton().click();

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(6)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:last-of-type")
    //   .click();

    // notificationCloseButton().should("be.visible").click();

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // reservationInfoPrice()
    //   .invoke("text")
    //   .then((text) => {
    //     expect(text).to.contain("Maksuton");
    //   });

    // dateSelector().clear().type(daysFromNow(2));

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();
    // matchEvent();

    // reservationInfoPrice()
    //   .invoke("text")
    //   .then((text) => {
    //     expect(text).to.contain("10,00 - 30,00\u00a0€");
    //   });

    // dateSelector().clear().type(daysFromNow(3));

    // startTimeSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:nth-of-type(2)")
    //   .click();
    // matchEvent();

    // reservationInfoPrice()
    //   .invoke("text")
    //   .then((text) => {
    //     expect(text).to.contain("80,00 - 200,00\u00a0€");
    //   });

    // durationSelectorToggle()
    //   .click()
    //   .siblings("ul")
    //   .children("li:last-of-type")
    //   .click();
    // matchEvent();

    // reservationInfoPrice()
    //   .invoke("text")
    //   .then((text) => {
    //     expect(text).to.contain("120,00 - 300,00\u00a0€");
    //   });

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});

describe("renders with basic data", () => {
  beforeEach(() => {
    cy.visit("/reservation-unit/1");
    cy.injectAxe();
  });

  it("contains default elements", () => {
    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");

    description().contains(
      "Sali sijaitsee nuorisotalon toisessa kerroksessa. Tilaan mahtuu 60 henkilöä."
    );

    equipment().contains("Tuoli FiKattila FiJoku muu Fi");

    addressContainer().should("have.length", 2);

    addressContainer(0).should("contain", "Säterintie 2 Fi");
    addressContainer(0).should("contain", "00720 Helsinki Fi");
    addressContainer(0).should("contain", "Avaa kartta uuteen ikkunaan");
    addressContainer(0).should("contain", "Google reittiohjeet");
    addressContainer(0).should("contain", "HSL Reittiopas");

    // textWithIcon(1).contains("Seuraava vapaa aika:");
    textWithIcon(0).should("have.text", "Nuorisopalvelut Fi");
    textWithIcon(1).should("have.text", "10 - 60 henkilöä");
    textWithIcon(2).should("have.text", "1 t - 3 t varaus");
    textWithIcon(3).should("have.text", "20 € / tunti");

    reservationInfo().contains(
      "Voit tehdä varauksen aikaisintaan 12 kuukautta ja viimeistään 2 päivää etukäteen."
    );
    reservationInfo().contains(
      `Tämä kohde on varattavissa ${reservationEnds(new Date(), true)}`
    );
    reservationInfo().contains(
      "Varauksen keston tulee olla välillä 1 tunti - 3 tuntia."
    );
    reservationInfo().contains(
      "Sinulla voi olla samanaikaisesti enintään yksi varaus."
    );

    reservationNotice().click();
    reservationNotice().contains(
      `Tämän kohteen hinta muuttuu ${toUIDate(addDays(new Date(), 2))} alkaen.`
    );
    reservationNotice().contains(
      "Uusi hinta on 10,00 - 30,00 € / tunti (sis. alv. 20%)"
    );

    paymentAndCancellationTerms().find("> button").contains("Peruutusehdot");
    paymentAndCancellationTerms().should("contain.text", "Peruutusehdot Fi");
    paymentAndCancellationTerms().should("not.contain.text", "Maksuehgot Fi");

    termsOfUse().find("> button").contains("Sopimusehdot");
    termsOfUse().should(
      "contain.text",
      "Palveluehto Palveluehto Palveluehto Palveluehto Palveluehto Palveluehto Palveluehto"
    );
    termsOfUse().should("contain.text", "Sopparijuttuja");
  });
});

describe("has pricing terms modal", () => {
  beforeEach(() => {
    cy.visit("/reservation-unit/3");
    cy.injectAxe();
  });

  it("can open and close modal", () => {
    textWithIcon(1).contains("40 henkilö");

    pricingTermsLink("reservation-unit-head").click();

    pricingTermsDialog().should("contain.text", "Alennusryhmät");
    pricingTermsDialog().should("contain.text", "Hinnoitteluehdot body Fi");

    pricingTermsDialog().find("button").click();
    pricingTermsDialog().should("not.exist");

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});

describe("quick reservation", () => {
  it("should do valid action logic", () => {
    cy.visit("/reservation-unit/902", { failOnStatusCode: false });

    dateSelect().click();

    nextAvailableTimeLink("desktop").click();
    timeSlots("desktop").first().click();
    price("desktop").should("contain.text", "Hinta: 10,00 - 30,00\u00a0€");

    durationSelect()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();

    price("desktop").should(
      "contain.text",
      "Hinta: 20,00 - 60,00\u00a0€, Tarkista alennusryhmät"
    );

    durationSelect()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(3)")
      .click();

    price("desktop").should("contain.text", "Hinta: 30,00 - 90,00\u00a0€");
    submitButton("desktop").should("not.be.disabled");

    timeSlots("desktop").first().click();
    submitButton("desktop").should("be.disabled");

    timeSlots("desktop").first().click();
    price("desktop").should("exist");
    submitButton("desktop").should("not.be.disabled");

    dateSelect()
      .clear()
      .type(toUIDate(addDays(new Date(), 3), "dd.MM.yyyy"))
      .blur();

    submitButton("desktop").should("be.disabled");

    timeSlots("desktop").first().click();
    price("desktop").should(
      "contain.text",
      "Hinta: 240,00 - 600,00\u00a0€, Tarkista alennusryhmät"
    );

    pricingTermsLink("quick-reservation").click();

    pricingTermsDialog().should("contain.text", "Alennusryhmät");
    pricingTermsDialog().should("contain.text", "Hinnoitteluehdot body Fi");

    pricingTermsDialog().find("button").click();
    pricingTermsDialog().should("not.exist");

    submitButton("desktop").should("not.be.disabled").click();

    cy.get("main#main").should("contain.text", "Täytä varauksen tiedot");

    reservationInfoCard().should(
      "contain.text",
      "Pukinmäen nuorisotalon keittiö"
    );
    reservationInfoCard().should("contain.text", "4 t");
  });
});

describe("without equipment", () => {
  it("doesn't display equipment accordion", () => {
    cy.visit("/reservation-unit/800");

    description().contains(
      "Sali sijaitsee nuorisotalon toisessa kerroksessa. Tilaan mahtuu 60 henkilöä.."
    );

    equipment().should("not.exist");
  });
});

describe("with payment terms", () => {
  it("does display an accordion for cancellation/payment terms and without pricing terms", () => {
    cy.visit("/reservation-unit/800");

    paymentAndCancellationTerms()
      .find("> button")
      .contains("Maksu- ja peruutusehdot");
    paymentAndCancellationTerms().contains("Maksuehdot Fi");
    pricingTerms().should("not.exist");
  });

  it("does display an accordion for both cancellation/payment and pricing terms", () => {
    cy.visit("/reservation-unit/801");

    paymentAndCancellationTerms()
      .find("> button")
      .contains("Maksu- ja peruutusehdot");
    paymentAndCancellationTerms().contains("Maksuehdot Fi");
    paymentAndCancellationTerms().contains("Peruutusehdot Fi");

    pricingTerms().find("> button").contains("Alennusryhmät");
    pricingTerms().contains("Hinnoitteluehdot Fi");
  });
});

describe("with reservation times", () => {
  it("should display no calendar controls when off season", () => {
    cy.visit("/reservation-unit/900");

    calendarWrapper().should("not.exist");
    reservationControls().should("not.exist");

    reservationStartNotification().should(
      "contain",
      "Voit tehdä varauksen tähän kohteeseen"
    );
  });
});

describe("with reservation quota notification", () => {
  it("should display apt notification if quota is set and full", () => {
    cy.visit("/reservation-unit/901");

    calendarWrapper().should("exist");

    reservationSubmitButton().should("not.exist");

    reservationQuotaNotification().should(
      "contain.text",
      "Et voi tehdä uusia varauksia."
    );

    reservationInfo().contains(
      "Sinulla voi olla samanaikaisesti enintään 10 varausta."
    );
  });

  it("should display apt notification if quota is set but not full", () => {
    cy.visit("/reservation-unit/902");

    calendarWrapper().should("exist");

    reservationQuotaNotification()
      .invoke("text")
      .should("match", /^Sinulla on \d+\/\d+ varausta tähän kohteeseen.$/);

    reservationInfo().contains(
      "Sinulla voi olla samanaikaisesti enintään 30 varausta."
    );
  });
});

describe("with metadataset", () => {
  it("can cancel an reservation with an application", () => {
    cy.visit("/reservation-unit/903");
    cy.injectAxe();

    drawReservation();

    reservationSubmitButton().click();

    cancelButton().click();

    hzNavigationBack().should("exist");

    cy.url().should("contain", "/reservation-unit/903");

    reservationEvent().should("not.exist");
  });

  it("can do reservation", () => {
    cy.visit("/reservation-unit/903");
    cy.injectAxe();

    drawReservation();

    reservationSubmitButton().click();

    ["freeOfChargeReason"].forEach((field) => {
      cy.get(`#${field}`).should("not.be.visible");
    });
    // reserveeTypeNonprofitButton().click({ force: true });
    reserveeTypeSelector(1).click();

    ["freeOfChargeReason"].forEach((field) => {
      cy.get(`#${field}`).should("not.be.visible");
    });
    cy.get("#applyingForFreeOfCharge").click();
    ["freeOfChargeReason"].forEach((field) => {
      cy.get(`#${field}`).should("be.visible");
    });
    cy.get("#freeOfChargeReason").type("Reason");

    reserveeTypeSelector(0).click();
    [
      "name",
      "description",
      "purpose-toggle-button",
      "numPersons",
      "ageGroup-toggle-button",
      "reserveeFirstName",
      "reserveeLastName",
      "reserveeAddressStreet",
      "reserveeAddressZip",
      "reserveeAddressCity",
      "reserveeEmail",
      "reserveePhone",
      "applyingForFreeOfCharge",
      "freeOfChargeReason",
    ].forEach((field) => {
      cy.get(`#${field}`).should("exist");
    });

    reserveeTypeSelector(2).click();

    [
      "name",
      "description",
      "purpose-toggle-button",
      "numPersons",
      "ageGroup-toggle-button",
      "reserveeFirstName",
      "reserveeLastName",
      "reserveeAddressStreet",
      "reserveeAddressZip",
      "reserveeAddressCity",
      "reserveeEmail",
      "reserveePhone",
      "applyingForFreeOfCharge",
      "freeOfChargeReason",
    ].forEach((field) => {
      cy.get(`#${field}`).should("exist");
    });

    cy.get("#reserveeEmail").clear().type("foo").blur();
    cy.get('button[type="submit"]').click();
    cy.get("#reserveeEmail-error").should(
      "contain.text",
      "Sähköpostin tulee olla oikeassa muodossa (sisältäen @-merkin)"
    );

    cy.get("#reserveeFirstName").clear().type("Forename");
    cy.get("#reserveeEmail").type("@bar.baz");
    cy.get("#reserveeId").type("123456-7");

    cy.checkA11y(undefined, undefined, undefined, true);

    cy.get('button[type="submit"]').click();

    cy.get("main#main").should("contain.text", "Tarkista varauksen tiedot");
    cy.get("main#main").should("contain.text", "Yhteyshenkilön etunimi");
    cy.get("main#main").should(
      "contain.text",
      "Yhteyshenkilön sähköpostiosoite"
    );
    cy.get("main#main").should(
      "contain.text",
      "Haen maksutonta käyttöä tai hinnan alennusta ja olen tutustunut alennusryhmiin."
    );
    cy.get("main#main").should("contain.text", "Y-tunnus");
    cy.get("main#main").should("contain.text", "123456-7");

    cancelButton().click();
    cy.get("#applyingForFreeOfCharge").click();
    cy.get('button[type="submit"]').click();

    cy.get("main#main").should("contain.text", "Tarkista varauksen tiedot");

    cy.get('button[type="submit"]').click();

    errorNotificationTitle().should("contain.text", "Täytä puuttuvat tiedot");
    errorNotificationBody().should(
      "contain.text",
      "Täytä seuraavat kohdat tehdäksesi varauksen:PeruutusehdotSopimusehdot"
    );

    cy.get("#generic-and-service-specific-terms-terms-accepted").click();

    cy.get('button[type="submit"]').click();

    errorNotificationTitle().should("contain.text", "Täytä puuttuvat tiedot");
    errorNotificationBody().should(
      "contain.text",
      "Täytä seuraavat kohdat tehdäksesi varauksen:Peruutusehdot"
    );

    cy.get("#cancellation-and-payment-terms-terms-accepted").click();

    cy.get('button[type="submit"]').click();

    cy.url().should(
      "contain",
      "https://www.google.com/00-11-22-33/paymentmethod?user=1234-abcd-9876-efgh&lang=fi"
    );
  });

  it("should populate default values", () => {
    cy.visit("/reservation-unit/700");
    cy.injectAxe();

    drawReservation();

    reservationSubmitButton().click();

    cy.get("#reserveeFirstName").should("have.value", "Foo");
    cy.get("#reserveeLastName").should("have.value", "Bar");
    cy.get("#reserveeEmail").should("have.value", "foo@bar.baz");
    cy.get("#reserveePhone").should("have.value", "123456789");
    cy.get("#reserveeAddressStreet").should("have.value", "Katu 13");
    cy.get("#reserveeAddressCity").should("have.value", "Helsinki");
    cy.get("#reserveeAddressZip").should("have.value", "00100");
    cy.get("#homeCity-toggle-button > span").should("contain", "Lande FI");
  });
});

describe("with application", () => {
  it("can do a reservation application", () => {
    cy.visit("/reservation-unit/908");
    cy.injectAxe();

    drawReservation();

    reservationSubmitButton().click();

    cy.get("#name").type("Reservation name");
    cy.get("#description").type("Reservation description");

    cy.get("#reserveeFirstName").type("Forename");
    cy.get("#reserveeLastName").type("Surname");

    cy.get('button[type="submit"]').click();

    cy.get("#generic-and-service-specific-terms-terms-accepted").click();
    cy.get("#cancellation-and-payment-terms-terms-accepted").click();

    cy.get('button[type="submit"]').click();

    cy.get("h1").should("contain.text", "Varaus käsittelyssä");

    cy.get("main#main").should(
      "contain.text",
      "Saat sähköpostiisi varausvahvistuksen, kun olemme käsitelleet varauksesi."
    );
  });

  it("can do a reservation application with applied subvention", () => {
    cy.visit("/reservation-unit/909");
    cy.injectAxe();

    drawReservation();

    reservationSubmitButton().click();

    cy.get("#name").type("Reservation name");
    cy.get("#description").type("Reservation description");

    cy.get("#applyingForFreeOfCharge").click();
    cy.get("#freeOfChargeReason").type("Free of charge reason");

    reserveeTypeSelector(0).click();

    cy.get("#reserveeFirstName").type("Forename");
    cy.get("#reserveeLastName").type("Surname");

    cy.get('button[type="submit"]').click();

    cy.get("#generic-and-service-specific-terms-terms-accepted").click();
    cy.get("#cancellation-and-payment-terms-terms-accepted").click();

    cy.get('button[type="submit"]').click();

    cy.get("h1").should("contain.text", "Varaus käsittelyssä");

    cy.get("main#main").should(
      "contain.text",
      "Saat sähköpostiisi varausvahvistuksen, kun olemme käsitelleet varauksesi."
    );
  });
});

describe("publish times", () => {
  it("should display draft item with non-matching publish range", () => {
    cy.visit("/reservation-unit/907?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619", {
      failOnStatusCode: false,
    });

    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
  });

  it("should not display draft item with non-matching publish range without valid uuid", () => {
    cy.visit("/reservation-unit/907", { failOnStatusCode: false });

    error404Title().should("have.text", "404");
    error404Body().should("have.text", "Sivua ei löytynyt");
  });

  it("should not display unpublished item", () => {
    cy.visit("/reservation-unit/905", { failOnStatusCode: false });

    error404Title().should("have.text", "404");
    error404Body().should("have.text", "Sivua ei löytynyt");
  });

  it("should not display unpublished item", () => {
    cy.visit("/reservation-unit/906", { failOnStatusCode: false });

    error404Title().should("have.text", "404");
    error404Body().should("have.text", "Sivua ei löytynyt");
  });
});

describe("preview", () => {
  it("should not display draft item", () => {
    cy.visit("/reservation-unit/999", { failOnStatusCode: false });

    cy.get("h1", { timeout: 5000 }).should("exist");
    cy.get("h1").should("contain", "404");
    cy.get("p").should("have.text", "Sivua ei löytynyt");
  });

  it("should display draft item if uuid matches", () => {
    cy.visit("/reservation-unit/999?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619");

    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
  });
});
