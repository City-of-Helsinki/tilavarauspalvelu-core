import {
  cancelButton as detailCancelButton,
  accordionToggler,
  reservationContent,
  reservationInfoCard,
  calendarLinkButton,
  modifyButton,
} from "model/reservation-detail";
import {
  startTimeSelectorToggle,
  reservationControlsDateInput,
  reservationEditActionCancel,
  reservationEditActionContinue,
  reservationEditActionBack,
  reservationEditActionSubmit,
  durationSelectorToggle,
} from "model/reservation-creation";
import {
  cancelButton,
  detailButton,
  reservationCards,
  tab,
  statusTag,
  orderStatusTag,
} from "model/reservation-list";
import {
  title as cancelTitle,
  cancelButton as cancelCancelButton,
  backButton,
  reasonSelect,
  customReasonInput,
  secondBackButton,
} from "model/reservation-cancel";
import { reservationControlsToggleButton } from "model/reservation-unit";
import {
  errorNotificationTitle,
  errorNotificationBody,
  errorNotificationCloseButton,
  errorNotification,
} from "model/notification";
import { addDays, format } from "date-fns";

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

    statusTag("desktop")
      .should("have.length", 5)
      .each(($el, $i) => {
        if ([0, 2, 4].includes($i)) {
          expect($el).to.contain("Hyväksytty");
        } else if ($i === 1) {
          expect($el).to.contain("Odottaa maksua");
        } else {
          expect($el).to.contain("Käsiteltävänä");
        }
      });

    orderStatusTag("desktop")
      .should("have.length", 2)
      .each(($el, $i) => {
        if ($i === 0) {
          expect($el).to.contain("Maksettu");
        } else if ($i === 2) {
          expect($el).to.contain("Paikan päällä");
        }
      });

    tab(1)
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Tulevat");
      });
    tab(2)
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Menneet");
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
      .find('[data-testid="reservation__card--status-desktop"]')
      .should("contain.text", "Käsiteltävänä");

    reservationCards()
      .eq(3)
      .find('[data-testid="reservation__card--price"]')
      .should("contain.text", "80,00 - 240,00\u00a0€");

    tab(2).click();

    reservationCards().should("have.length", 2);
    statusTag("desktop")
      .should("have.length", 2)
      .each(($el) => {
        expect($el).to.contain("Hyväksytty");
      });
  });

  it("should display reservation detail view with company reservee", () => {
    detailButton().eq(1).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/11$/);

    detailCancelButton().should("not.exist");

    reservationContent().find("h1").should("contain", "Varaus 11");
    reservationContent().find("h2").should("contain", "Toimistohuone 1");

    orderStatusTag("desktop").should("contain", "Maksettu");

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

    reservationInfoCard().find("h3").should("contain.text", "Toimistohuone 1");
    reservationInfoCard()
      .should("contain.text", "Varausnumero: 11")
      .should("contain.text", "Ke 28.4.2021 klo")
      .should("contain.text", ", 4 t")
      .should(
        "contain.text",
        "Varauksen kuvaus: Reservation description - a long one with alotta text"
      )
      .should("contain.text", "Hinta: 42,00\u00a0€")
      .should("contain.text", "Käyttötarkoitus: Liikkua tai pelata FI")
      .should("contain.text", "Ikäryhmä: 5 - 8")
      .should("contain.text", "Osallistujamäärä: 18");

    calendarLinkButton()
      .should("be.enabled")
      .should("contain.text", "Tallenna kalenteriin");

    cy.checkA11y(undefined, undefined, undefined, true);
  });

  it("should display reservation detail view with individual reservee", () => {
    detailButton().eq(0).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);

    detailCancelButton().should("not.exist");

    reservationContent().find("h1").should("contain", "Varaus 4");
    reservationContent().find("h2").should("contain", "Toimistohuone 1");

    orderStatusTag("desktop").should("contain", "Odottaa maksua");

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

    reservationInfoCard().find("h3").should("contain.text", "Toimistohuone 1");
    reservationInfoCard()
      .should("contain.text", "Varausnumero: 4")
      .should("contain.text", ", 2 t")
      .should(
        "contain.text",
        "Varauksen kuvaus: Reservation description - a long one with alotta text"
      )
      .should("contain.text", "Hinta: Maksuton")
      .should("contain.text", "Käyttötarkoitus: Liikkua tai pelata FI")
      .should("contain.text", "Ikäryhmä: 5 - 8")
      .should("contain.text", "Osallistujamäärä: 18");

    calendarLinkButton()
      .should("be.enabled")
      .should("contain.text", "Tallenna kalenteriin");

    cy.checkA11y(undefined, undefined, undefined, true);
  });

  it("should do cancellation", () => {
    detailButton().eq(4).click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21$/);
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    cancelTitle().should("have.text", "Peru varaus");
    cancelCancelButton().should("be.disabled");

    orderStatusTag("desktop").should("not.exist");

    backButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21$/);

    cy.visit("/reservations");

    detailButton().eq(4).click();
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    cancelCancelButton().should("be.disabled");

    reasonSelect().click().siblings("ul").children().eq(0).click();
    cancelCancelButton().should("be.disabled");

    reasonSelect().click().siblings("ul").children().eq(1).click();
    cancelCancelButton().should("not.be.disabled");

    cancelCancelButton().click();
    cancelTitle().should("have.text", "Varaus peruttu!");

    reservationInfoCard()
      .should("contain.text", ", 2 t")
      // .should("contain.text", "(alv %)")
      .should("contain.text", "Hinta: 42,00\u00a0€");

    secondBackButton().should("exist");
  });

  it("should do time modification", () => {
    const titles = ["Muuta varauksen aikaa", "Tarkista varauksen tiedot"];

    detailButton().eq(0).click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);
    modifyButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4\/edit$/);

    reservationEditActionCancel().click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);
    modifyButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4\/edit$/);
    cy.get("h1").should("have.text", titles[0]);

    reservationControlsDateInput().should("not.exist");
    reservationControlsToggleButton().click();
    reservationControlsDateInput().should("exist");

    const newDate = format(addDays(new Date(), 7), "d.M.yyyy");

    reservationEditActionContinue().should("be.disabled");
    reservationControlsDateInput().clear().type(newDate).blur();
    reservationEditActionContinue().should("be.disabled");
    startTimeSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();
    reservationEditActionContinue().should("be.disabled");
    durationSelectorToggle().click().siblings("ul").children().eq(1).click();

    reservationEditActionContinue().should("not.be.disabled");
    reservationEditActionContinue().click();
    cy.get("h1").should("have.text", titles[1]);

    reservationEditActionBack().click();
    cy.get("h1").should("have.text", titles[0]);

    reservationEditActionContinue().click();
    cy.get("h1").should("have.text", titles[1]);

    reservationEditActionSubmit().click();

    errorNotificationTitle().should(
      "have.text",
      "Varauksen muokkaaminen epäonnistui"
    );
    errorNotificationBody().should("have.text", "Hyväksy ehdot jatkaaksesi.");
    errorNotificationCloseButton().click();

    cy.get("#cancellation-and-payment-terms-terms-accepted").click();
    cy.get("#generic-and-service-specific-terms-terms-accepted").click();

    reservationEditActionSubmit().click();

    errorNotification().should("not.exist");

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);
  });
});
