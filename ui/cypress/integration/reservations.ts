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
    const details = [
      { slug: "name", value: "Reservation name" },
      { slug: "reserveeName", value: "First name Last name" },
      { slug: "description", value: "Reservation description" },
      { slug: "unit", value: "Toimistohuone 1" },
      { slug: "phone", value: "+358 123 4567" },
    ];

    detailButton().eq(0).click();

    cy.url({ timeout: 20000 }).should("match", /\/reservations\/4$/);

    modifyButton().should("be.disabled");
    detailCancelButton().should("be.disabled");

    ticket().should("have.css", "background-color", "rgb(225, 245, 243)");

    cy.get("main#main").should(
      "contain.text",
      "Saat sähköpostiisi (user@gmail.com) muistutuksen varauksesta."
    );

    details.forEach(({ slug, value }) => {
      reservationDetail(slug)
        .should("not.be.visible")
        .find("span")
        .eq(1)
        .should("have.text", value);
    });
    accordionToggler().eq(0).click();
    details.forEach(({ slug }) => {
      reservationDetail(slug).should("be.visible");
    });

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
    cancelTitle().eq(1).should("have.text", "Peru varaus");
    cancelCancelButton().should("be.disabled");

    backButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations$/);

    detailButton().eq(3).click();
    detailCancelButton().click();
    cy.url({ timeout: 20000 }).should("match", /\/reservations\/21\/cancel$/);

    reasonSelect().click().siblings("ul").children().eq(1).click();
    customReasonInput().type("A reason");

    cancelCancelButton().click();
    ticket().should("have.css", "background-color", "rgb(255, 225, 225)");
    cancelTitle().eq(1).should("have.text", "Varaus on peruttu");

    secondBackButton().should("exist");
    reReserveButton().click();

    cy.url({ timeout: 20000 }).should(
      "match",
      /\/reservation-unit\/single\/9$/
    );
  });
});
