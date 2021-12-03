import { hzNavigationBack } from "model/calendar";
import {
  modifyButton,
  cancelButton as detailCancelButton,
  accordionToggler,
  reservationDetail,
  returnButton,
} from "model/reservation-detail";
import {
  cancelButton,
  detailButton,
  redoReservationButton,
  reservationCards,
  tab,
  ticket,
  timeStrip,
} from "model/reservation-list";
import {
  title as cancelTitle,
  cancelButton as cancelCancelButton,
  backButton,
  reasonSelect,
  customReasonInput,
  reReserveButton,
  secondBackButton,
} from "model/reservation-cancel";

describe("Tilavaraus user reservations", () => {
  beforeEach(() => {
    cy.visit("/reservations");
  });

  it("should list proper items with correct button states and link to reservation unit", () => {
    tab(1)
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Tulevat varaukset (4)");
      });
    tab(2)
      .invoke("text")
      .then((text) => {
        expect(text).to.eq("Menneet varaukset (2)");
      });

    reservationCards().should("have.length", 4);
    timeStrip()
      .should("have.length", 4)
      .each(($el) => {
        expect($el).to.contain("Tulossa");
      });

    cancelButton().eq(0).should("be.disabled");
    cancelButton().eq(1).should("be.disabled");
    cancelButton().eq(2).should("be.disabled");
    cancelButton().eq(3).should("not.be.disabled");

    tab(2).click();

    reservationCards().should("have.length", 2);
    timeStrip()
      .should("have.length", 2)
      .each(($el) => {
        expect($el).to.contain("Mennyt");
      });

    redoReservationButton().eq(0).click();

    cy.url({ timeout: 20000 }).should(
      "match",
      /\/reservation-unit\/single\/1$/
    );

    hzNavigationBack().should("exist");
  });

  it("should display reservation detail view", () => {
    detailButton().eq(0).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);

    modifyButton().should("be.disabled");
    detailCancelButton().should("be.disabled");

    ticket().should("have.css", "background-color", "rgb(225, 245, 243)");

    cy.get("main#main").should(
      "contain.text",
      "Saat sähköpostiisi (user@gmail.com) muistutuksen varauksesta."
    );

    cy.contains("div", "Additional Instructions FI").should("not.be.visible");
    accordionToggler().eq(0).click();
    cy.contains("div", "Additional Instructions FI").should("be.visible");

    cy.contains("div", "Terms of use FI").should("not.be.visible");
    accordionToggler().eq(1).click();
    cy.contains("div", "Terms of use FI").should("be.visible");

    cy.contains("div", "Service specific terms FI").should("not.be.visible");
    accordionToggler().eq(2).click();
    cy.contains("div", "Service specific terms FI").should("be.visible");

    returnButton().click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations$/);
  });

  it("should do cancellation", () => {
    detailButton().eq(3).click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21$/);
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    ticket().should("have.css", "background-color", "rgb(225, 245, 243)");
    cancelTitle().eq(0).should("have.text", "Toimistohuone 1");
    cancelTitle().eq(1).should("have.text", "Peruuta varaus");
    cancelCancelButton().should("be.disabled");

    backButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations$/);

    detailButton().eq(3).click();
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    cancelCancelButton().should("be.disabled");

    reasonSelect().click().siblings("ul").children().eq(0).click();
    cancelCancelButton().should("be.disabled");

    reasonSelect().click().siblings("ul").children().eq(1).click();
    cancelCancelButton().should("not.be.disabled");
    customReasonInput().type("A reason");

    cancelCancelButton().click();
    ticket().should("have.css", "background-color", "rgb(255, 225, 225)");
    cancelTitle().eq(1).should("have.text", "Varaus on peruutettu");

    secondBackButton().should("exist");
    reReserveButton().click();

    cy.url({ timeout: 20000 }).should(
      "match",
      /\/reservation-unit\/single\/9$/
    );
  });
});
