import { toUIDate } from "common/src/common/util";
import { addDays, addHours, addMinutes, format } from "date-fns";
import {
  hzNavigationBack,
  hzNavigationFwd,
  reservationSubmitButton,
  timeColumn,
} from "model/calendar";
import { error404Body, error404Title } from "model/error";
import {
  errorNotificationBody,
  errorNotificationTitle,
} from "model/notification";
import {
  dateSelect,
  durationSelect,
  nextAvailableTimeLink,
  price,
  submitButton,
  timeSlots,
} from "model/quick-reservation";
import {
  reserveeTypeBusinessButton,
  reserveeTypeIndividualButton,
  reserveeTypeNonprofitButton,
} from "model/reservation-application";
import {
  confirmationParagraph,
  reservationConfirmationTimeRange,
  formField,
  reservationTitle,
  updateButton,
  cancelButton,
  calendarUrlButton,
  reservationInfoPrice,
  dateSelector,
  reservationEvent,
  durationSelectorToggle,
  startTimeSelectorToggle,
  reservationStartNotification,
  calendarWrapper,
  reservationQuotaNotification,
  reserveeTypeSelector,
} from "model/reservation-creation";
import { reservationInfoCard } from "model/reservation-detail";
import { ticket } from "model/reservation-list";
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
} from "model/reservation-unit";
import { textWithIcon } from "model/search";

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
              const startTime = `${hours.padStart(2, "0")}.${minutes}`;
              const [durationHours, durationMinutes] = duration.split(":");
              const endTime = format(
                addMinutes(
                  addHours(
                    new Date().setHours(Number(hours), Number(minutes)),
                    Number(durationHours)
                  ),
                  Number(durationMinutes)
                ),
                "HH.mm"
              );
              expect(text).to.eq(`${startTime} – ${endTime}`);
            });
        });
    });
};

const reservationEnds = format(addDays(new Date(), 10), "d.M.yyyy");

const drawReservation = (): void => {
  hzNavigationFwd().click();

  timeColumn(0).within(() => {
    cy.get(".rbc-time-slot")
      .eq(18)
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 400, { force: true });
    cy.get(".rbc-time-slot").eq(6).trigger("mouseup", { force: true });
  });
  reservationSubmitButton().should("be.disabled");

  timeColumn(1).within(() => {
    cy.get(".rbc-time-slot")
      .eq(18)
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 40, { force: true });
    cy.get(".rbc-time-slot").eq(16).trigger("mouseup", { force: true });
  });

  durationSelectorToggle()
    .click()
    .siblings("ul")
    .children("li:nth-of-type(2)")
    .click();

  reservationSubmitButton().should("not.disabled");
  matchEvent();
};

describe("Tilavaraus ui reservation unit page (single)", () => {
  describe("with basic data", () => {
    Cypress.config("defaultCommandTimeout", 20000);

    beforeEach(() => {
      cy.visit("/reservation-unit/1");
      cy.injectAxe();
    });

    it("contains default elements", () => {
      cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");

      description().contains(
        "Sali sijaitsee nuorisotalon toisessa kerroksessa. Tilaan mahtuu 60 henkilöä.."
      );

      equipment().contains("Tuoli FiKattila FiJoku muu Fi");

      addressContainer().should("have.length", 1);

      addressContainer(0).should("contain", "Säterintie 2 Fi");
      addressContainer(0).should("contain", "00720 Helsinki Fi");
      addressContainer(0).should("contain", "Avaa kartta uuteen ikkunaan");
      addressContainer(0).should("contain", "Google reittiohjeet");
      addressContainer(0).should("contain", "HSL Reittiopas");

      // textWithIcon(1).contains("Seuraava vapaa aika:");
      textWithIcon(0).contains("Nuorisopalvelut Fi");
      textWithIcon(1).contains("60 henkilöä");
      textWithIcon(2).contains("20 € / 15 min");
      textWithIcon(3).contains("1 t – 1 t 30 min");

      reservationInfo().contains(
        "Voit tehdä varauksen aikaisintaan 12 kuukautta ja viimeistään 2 päivää etukäteen."
      );
      reservationInfo().contains(
        `Varauskalenteri on auki ${reservationEnds} asti.`
      );
      reservationInfo().contains(
        "Varauksen keston tulee olla välillä 1 tunti ja 1 tunti 30 minuuttia."
      );
      reservationInfo().contains(
        "Sinulla voi olla samanaikaisesti enintään yksi varaus."
      );

      reservationNotice().click();
      reservationNotice().contains(
        `Huomioi hinnoittelumuutos ${toUIDate(addDays(new Date(), 2))} alkaen.`
      );
      reservationNotice().contains(
        "Uusi hinta on 10 - 30 € / 15 min (sis. alv. 20%)."
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

    it("allows making a reservation", () => {
      calendarWrapper().should("exist");

      reservationQuotaNotification().should("not.exist");

      drawReservation();

      reservationInfoPrice()
        .invoke("text")
        .then((text) => {
          expect(text).to.contain("100 - 250\u00a0€");
        });

      cy.checkA11y(null, null, null, true);

      reservationSubmitButton().click();

      const form1Top = [
        { label: "name", value: "Varaus" },
        { label: "description", value: "Kuvaus", type: "textarea" },
      ];

      const form1Bottom = [
        { label: "reserveeFirstName", value: "Etunimi" },
        { label: "reserveeLastName", value: "Sukunimi" },
      ];

      const form2 = [{ label: "spaceTerms" }, { label: "resourceTerms" }];

      updateButton().click();
      form1Top.forEach((field) => {
        cy.get(`#${field.label}-error`).should("exist");
      });

      form1Top.forEach((field) => {
        formField(field.label, field.type).type(field.value);
      });

      form1Top.forEach((field) => {
        cy.get(`#${field.label}-error`).should("not.exist");
      });

      cy.checkA11y(null, null, null, true);

      updateButton().click();

      errorNotificationTitle().should(
        "contain.text",
        "Varauksen päivitys epäonnistui"
      );
      errorNotificationBody().should("contain.text", "Valitse hakijan tyyppi");

      reserveeTypeSelector(1).click();

      form1Bottom.forEach((field) => {
        formField(field.label).click();
      });

      updateButton().click();
      form1Bottom.forEach((field) => {
        cy.get(`#${field.label}-error`).should("exist");
      });

      form1Bottom.forEach((field) => {
        formField(field.label).type(field.value);
      });

      form1Bottom.forEach((field) => {
        cy.get(`#${field.label}-error`).should("not.exist");
      });

      updateButton().click();

      form2.forEach((field) => {
        const input = formField(field.label);
        input.should("exist");
        input.click();
      });

      form2.forEach((field) => {
        cy.get(`#${field.label}-error`).should("not.exist");
      });

      updateButton().click();

      cy.contains("h4", "Tietoa varauksestasi").should("be.visible");
      cy.contains("p", "Confirmed Instructions FI").should("be.visible");

      cy.contains("button", "Palaa Varaamon etusivulle");

      calendarUrlButton().should("exist");

      cy.checkA11y(null, null, null, true);
    });

    it("can cancel reservation process", () => {
      drawReservation();

      cy.checkA11y(null, null, null, true);

      reservationSubmitButton().click();

      cy.checkA11y(null, null, null, true);

      cancelButton().click();

      hzNavigationBack().should("exist");

      cy.url().should("contain", "/reservation-unit/1");

      reservationEvent().should("not.exist");
    });

    it("can do the reservation with form inputs", () => {
      const today = format(new Date(), "d.M.yyyy");
      dateSelector()
        .invoke("val")
        .then((value) => {
          expect(value).to.eq(today);
        });

      dateSelector()
        .parent()
        .find('button[aria-label="Valitse päivämäärä"]')
        .click();

      dateSelector()
        .parent()
        .find('select[aria-label="Kuukausi"]')
        .invoke("val")
        .then((value) => {
          expect(value).to.eq(new Date().getMonth().toString());
        });

      dateSelector()
        .parent()
        .find('button[aria-label="Seuraava kuukausi"]')
        .click();

      dateSelector()
        .parent()
        .find('select[aria-label="Kuukausi"]')
        .invoke("val")
        .then((value) => {
          const monthNow = new Date().getMonth();
          const monthNext = monthNow === 11 ? 0 : monthNow + 1;
          expect(value).to.eq(monthNext.toString());
        });

      // TODO: fix timezone issues to make this test pass
      // dateSelector().clear().type(nextWeek);

      // startTimeSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:nth-of-type(6)")
      //   .click();
      // matchEvent();

      // notificationContainer().should("not.exist");

      // durationSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:nth-of-type(2)")
      //   .click();

      // notificationContainer().contains(
      //   "Varauksen puskuriajan vaatimukset eivät täyty. Valitse toinen varausaika."
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
      // matchEvent();

      // notificationContainer().should("not.exist");

      // durationSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:nth-of-type(2)")
      //   .click();

      // notificationContainer().contains(
      //   "Varauksen puskuriajan vaatimukset eivät täyty. Valitse toinen varausaika."
      // );
      // notificationCloseButton().click();

      // startTimeSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:nth-of-type(4)")
      //   .click();

      // notificationContainer().contains(
      //   "Valittu aika on varattu. Valitse toinen aika."
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

      // durationSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:first-of-type")
      //   .click();
      // matchEvent();

      // reservationInfoPrice()
      //   .invoke("text")
      //   .then((text) => {
      //     expect(text).to.contain("80\u00a0€");
      //   });

      // startTimeSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:first-of-type")
      //   .click();
      // matchEvent();

      // durationSelectorToggle()
      //   .click()
      //   .siblings("ul")
      //   .children("li:nth-of-type(2)")
      //   .click();
      // matchEvent();

      // reservationInfoPrice()
      //   .invoke("text")
      //   .then((text) => {
      //     expect(text).to.contain("100\u00a0€");
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
      //     expect(text).to.contain("120\u00a0€");
      //   });

      cy.checkA11y(null, null, null, true);
    });
  });

  describe("quick reservation", () => {
    it("should do valid action logic", () => {
      cy.visit("/reservation-unit/902", { failOnStatusCode: false });

      dateSelect().click();
      price("desktop").should("not.exist");

      nextAvailableTimeLink("desktop").click();
      timeSlots("desktop").first().click();
      price("desktop").should("contain.text", "Hinta: 40 - 120\u00a0€");

      durationSelect()
        .click()
        .siblings("ul")
        .children("li:nth-of-type(2)")
        .click();

      price("desktop").should("contain.text", "Hinta: 50 - 150\u00a0€");

      durationSelect()
        .click()
        .siblings("ul")
        .children("li:nth-of-type(3)")
        .click();

      price("desktop").should("contain.text", "Hinta: 60 - 180\u00a0€");
      submitButton("desktop").should("not.be.disabled");

      timeSlots("desktop").first().click();
      price("desktop").should("not.exist");
      submitButton("desktop").should("be.disabled");

      timeSlots("desktop").first().click();
      price("desktop").should("exist");
      submitButton("desktop").should("not.be.disabled");

      dateSelect()
        .clear()
        .type(toUIDate(addDays(new Date(), 3), "dd.MM.yyyy"))
        .blur();

      price("desktop").should("not.exist");
      submitButton("desktop").should("be.disabled");

      timeSlots("desktop").first().click();
      price("desktop").should("contain.text", "Hinta: 120 - 300\u00a0€");
      submitButton("desktop").should("not.be.disabled").click();

      cy.get("main#main").should("contain.text", "Täytä varauksen tiedot");

      reservationInfoCard().should(
        "contain.text",
        "Pukinmäen nuorisotalon keittiö"
      );
      reservationInfoCard().should("contain.text", "1 t 30 min");
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
    it("does display an accordion for both cancellation/payment and pricing terms", () => {
      cy.visit("/reservation-unit/801");

      paymentAndCancellationTerms()
        .find("> button")
        .contains("Maksu- ja peruutusehdot");
      paymentAndCancellationTerms().contains("Maksuehdot Fi");
      paymentAndCancellationTerms().contains("Peruutusehdot Fi");

      pricingTerms().find("> button").contains("Hinnoitteluperiaatteet");
      pricingTerms().contains("Hinnoitteluehdot Fi");
    });
  });

  describe("preview", () => {
    Cypress.config("defaultCommandTimeout", 20000);

    it("should not display draft item", () => {
      cy.visit("/reservation-unit/999", { failOnStatusCode: false });

      error404Title().should("have.text", "404");
      error404Body().should("have.text", "Sivua ei löytynyt");
    });

    it("should display draft item if uuid matches", () => {
      cy.visit("/reservation-unit/999?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619");

      cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
    });
  });

  describe("with reservation times", () => {
    it("should display no calendar controls when off season", () => {
      cy.visit("/reservation-unit/900");

      calendarWrapper().should("exist");
      reservationControls().should("not.exist");

      reservationStartNotification().should(
        "contain",
        "Varauskalenteri aukeaa"
      );
    });
  });

  describe("with reservation quota notification", () => {
    it("should display apt notification if quota is set and full", () => {
      cy.window().then(() => {
        sessionStorage.setItem(
          `oidc.apiToken.${Cypress.env("API_SCOPE")}`,
          "foobar"
        );
      });

      cy.visit("/reservation-unit/901");

      calendarWrapper().should("exist");

      reservationSubmitButton().should("not.exist");

      reservationQuotaNotification()
        .invoke("text")
        .should(
          "match",
          /^Sinulla on jo \d+ varausta tähän tilaan. Et voi tehdä uusia varauksia.$/
        );

      reservationInfo().contains(
        "Sinulla voi olla samanaikaisesti enintään 10 varausta."
      );

      cy.window().then(() => {
        sessionStorage.removeItem(`oidc.apiToken.${Cypress.env("API_SCOPE")}`);
      });
    });

    it("should display apt notification if quota is set but not full", () => {
      cy.window().then(() => {
        sessionStorage.setItem(
          `oidc.apiToken.${Cypress.env("API_SCOPE")}`,
          "foobar"
        );
      });

      cy.visit("/reservation-unit/902");

      calendarWrapper().should("exist");

      reservationQuotaNotification()
        .invoke("text")
        .should("match", /^Sinulla on jo \d+\/\d+ varausta tähän tilaan.$/);

      reservationInfo().contains(
        "Sinulla voi olla samanaikaisesti enintään 30 varausta."
      );

      cy.window().then(() => {
        sessionStorage.removeItem(`oidc.apiToken.${Cypress.env("API_SCOPE")}`);
      });
    });
  });

  describe("with metadataset", () => {
    Cypress.config("defaultCommandTimeout", 20000);
    beforeEach(() => {
      cy.visit("/reservation-unit/903");
      cy.injectAxe();
    });

    it("can cancel an reservation with an application", () => {
      drawReservation();

      reservationSubmitButton().click();

      cancelButton().click();

      hzNavigationBack().should("exist");

      cy.url().should("contain", "/reservation-unit/903");

      reservationEvent().should("not.exist");
    });

    it("can do reservation", () => {
      drawReservation();

      reservationSubmitButton().click();

      ["freeOfChargeReason"].forEach((field) => {
        cy.get(`#${field}`).should("not.be.visible");
      });
      // reserveeTypeNonprofitButton().click({ force: true });
      reserveeTypeSelector(1).click();

      cy.get("#applyingForFreeOfCharge").click();
      ["freeOfChargeReason"].forEach((field) => {
        cy.get(`#${field}`).should("exist");
      });

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

      cy.get('button[type="submit"]').click();

      [cy.get("#reserveeFirstName-error")].forEach((error) =>
        error.should("contain.text", "Kenttä on pakollinen")
      );

      cy.get("#reserveeEmail").type("foo").blur();
      cy.get("#reserveeEmail-error").should(
        "contain.text",
        "Virheellinen sähköpostiosoite"
      );

      cy.get("#reserveeFirstName").type("Forename");
      cy.get("#reserveeEmail").type("@bar.baz");

      cy.checkA11y(null, null, null, true);

      cy.get('button[type="submit"]').click();

      cy.get("main#main").should("contain.text", "Tarkista varauksen tiedot");
      cy.get("main#main").should("contain.text", "Yhteyshenkilön etunimi");
      cy.get("main#main").should(
        "contain.text",
        "Yhteyshenkilön sähköpostiosoite"
      );
      cy.get("main#main").should("contain.text", "Haen maksutonta varausta");

      [{ label: "spaceTerms" }, { label: "resourceTerms" }].forEach((field) => {
        formField(field.label).click();
      });

      cy.get('button[type="submit"]').click();

      cy.get("main#main").should("contain.text", "Varaus tehty");
    });
  });

  describe("publish times", () => {
    Cypress.config("defaultCommandTimeout", 20000);

    it("should display draft item with non-matching publish range", () => {
      cy.visit(
        "/reservation-unit/907?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619",
        { failOnStatusCode: false }
      );

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
});
