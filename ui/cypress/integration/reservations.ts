import { hzNavigationBack } from "model/calendar";
import {
  cancelButton as detailCancelButton,
  accordionToggler,
  reservationContent,
  reservationInfoCard,
  calendarLinkButton,
} from "model/reservation-detail";
import {
  cancelButton,
  detailButton,
  redoReservationButton,
  reservationCards,
  tab,
  timeStrip,
} from "model/reservation-list";
import {
  title as cancelTitle,
  cancelButton as cancelCancelButton,
  backButton,
  reasonSelect,
  customReasonInput,
  secondBackButton,
} from "model/reservation-cancel";

describe("Tilavaraus user reservations", () => {
  beforeEach(() => {
    cy.window().then(() => {
      sessionStorage.setItem(
        `oidc.apiToken.${Cypress.env("API_SCOPE")}`,
        "foobar"
      );
    });

    cy.visit("/reservations");
    cy.injectAxe();
  });

  afterEach(() => {
    cy.window().then(() => {
      sessionStorage.removeItem(`oidc.apiToken.${Cypress.env("API_SCOPE")}`);
    });
  });

  it("should list proper items with correct button states and link to reservation unit", () => {
    reservationCards().should("have.length", 5);
    timeStrip()
      .should("have.length", 5)
      .each(($el, $i) => {
        if ([0, 1, 2, 4].includes($i)) {
          expect($el).to.contain("Tulossa");
        } else {
          expect($el).to.contain("Varaus käsittelyssä");
        }
      });

    tab(1)
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Tulevat varaukset (5)");
      });
    tab(2)
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Menneet varaukset (2)");
      });

    cancelButton().should("exist");

    reservationCards()
      .eq(0)
      .find('[data-testid="reservation__card--price"]')
      .should("contain.text", "42\u00a0€");

    reservationCards()
      .eq(1)
      .find('[data-testid="reservation__card--price"]')
      .should("contain.text", "Maksuton");

    reservationCards()
      .eq(3)
      .find('[data-testid="reservation__card--time"]')
      .should("contain.text", "Varaus käsittelyssä");

    tab(2).click();

    reservationCards().should("have.length", 2);
    timeStrip()
      .should("have.length", 2)
      .each(($el) => {
        expect($el).to.contain("Mennyt");
      });

    redoReservationButton().eq(0).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservation-unit\/1$/);

    hzNavigationBack().should("exist");
  });

  it("should display reservation detail view with company reservee", () => {
    detailButton().eq(1).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/11$/);

    detailCancelButton().should("not.exist");

    reservationContent().find("h1").should("contain", "Varaus 11");
    reservationContent().find("h2").should("contain", "Toimistohuone 1");

    cy.contains("div", "Confirmed Instructions FI").should("be.visible");

    reservationContent()
      .should("contain.text", "Yrityksen nimi: Acme Oyj")
      .should("contain.text", "Yhteyshenkilön nimi: First name Last name")
      .should("contain.text", "Yhteyshenkilön puhelinnumero: +358 123 4567")
      .should("contain.text", "Yhteyshenkilön sähköposti: email@example.com");

    cy.contains("div", "Payment terms FI").should("not.be.visible");
    cy.contains("div", "Cancellation terms FI").should("not.be.visible");
    accordionToggler("reservation__payment-and-cancellation-terms").click();
    cy.contains("div", "Payment terms FI").should("be.visible");
    cy.contains("div", "Cancellation terms FI").should("be.visible");

    cy.contains("div", "Pricing terms FI").should("not.be.visible");
    accordionToggler("reservation__pricing-terms").click();
    cy.contains("div", "Pricing terms FI").should("be.visible");

    cy.contains("div", "Sopparijuttuja").should("not.be.visible");
    cy.contains("div", "Toinen rivi").should("not.be.visible");
    accordionToggler("reservation__terms-of-use").click();
    cy.contains("div", "Sopparijuttuja").should("be.visible");
    cy.contains("div", "Toinen rivi").should("be.visible");

    reservationInfoCard()
      .find("h3")
      .should("contain.text", "Reservation name / Toimistohuone 1");
    reservationInfoCard()
      .should("contain.text", "Varausnumero: 11")
      .should("contain.text", "Ke 28.4.2021 klo")
      .should("contain.text", "Kesto: 4 t")
      .should(
        "contain.text",
        "Varauksen kuvaus: Reservation description - a long one with alotta text"
      )
      .should("contain.text", "Hinta: 42\u00a0€")
      .should("contain.text", "Käyttötarkoitus: Liikkua tai pelata FI")
      .should("contain.text", "Ikäryhmä: 5 - 8")
      .should("contain.text", "Osallistujamäärä: 18");

    calendarLinkButton()
      .should("be.enabled")
      .should("contain.text", "Tallenna kalenteriin");

    cy.checkA11y(null, null, null, true);
  });

  it("should display reservation detail view with individual reservee", () => {
    detailButton().eq(0).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);

    detailCancelButton().should("not.exist");

    reservationContent().find("h1").should("contain", "Varaus 4");
    reservationContent().find("h2").should("contain", "Toimistohuone 1");

    cy.contains("div", "Confirmed Instructions FI").should("be.visible");

    reservationContent()
      .should("contain.text", "Nimi: First name Last name")
      .should("contain.text", "Puhelin: +358 123 4567")
      .should("contain.text", "Sähköposti: email@example.com");

    cy.contains("div", "Payment terms FI").should("not.be.visible");
    cy.contains("div", "Cancellation terms FI").should("not.be.visible");
    accordionToggler("reservation__payment-and-cancellation-terms").click();
    cy.contains("div", "Payment terms FI").should("be.visible");
    cy.contains("div", "Cancellation terms FI").should("be.visible");

    cy.contains("div", "Pricing terms FI").should("not.be.visible");
    accordionToggler("reservation__pricing-terms").click();
    cy.contains("div", "Pricing terms FI").should("be.visible");

    cy.contains("div", "Sopparijuttuja").should("not.be.visible");
    cy.contains("div", "Toinen rivi").should("not.be.visible");
    accordionToggler("reservation__terms-of-use").click();
    cy.contains("div", "Sopparijuttuja").should("be.visible");
    cy.contains("div", "Toinen rivi").should("be.visible");

    reservationInfoCard()
      .find("h3")
      .should("contain.text", "Reservation name / Toimistohuone 1");
    reservationInfoCard()
      .should("contain.text", "Varausnumero: 4")
      .should("contain.text", "Ke 28.4.2021 klo")
      .should("contain.text", "Kesto: 4 t")
      .should(
        "contain.text",
        "Varauksen kuvaus: Reservation description - a long one with alotta text"
      )
      .should("contain.text", "Hinta: 42\u00a0€")
      .should("contain.text", "Käyttötarkoitus: Liikkua tai pelata FI")
      .should("contain.text", "Ikäryhmä: 5 - 8")
      .should("contain.text", "Osallistujamäärä: 18");

    calendarLinkButton()
      .should("be.enabled")
      .should("contain.text", "Tallenna kalenteriin");

    cy.checkA11y(null, null, null, true);
  });

  it("should do cancellation", () => {
    detailButton().eq(4).click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21$/);
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    cancelTitle().should("have.text", "Peru varaus");
    cancelCancelButton().should("be.disabled");

    backButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations$/);

    detailButton().eq(4).click();
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    cancelCancelButton().should("be.disabled");

    reasonSelect().click().siblings("ul").children().eq(0).click();
    cancelCancelButton().should("be.disabled");

    reasonSelect().click().siblings("ul").children().eq(1).click();
    cancelCancelButton().should("not.be.disabled");
    customReasonInput().type("A reason");

    cancelCancelButton().click();
    cancelTitle().should("have.text", "Varaus on peruttu!");

    reservationInfoCard()
      .should("contain.text", "Kesto: 2 t")
      // .should("contain.text", "(alv %)")
      .should("contain.text", "Hinta: 42\u00a0€");

    secondBackButton().should("exist");
  });
});
