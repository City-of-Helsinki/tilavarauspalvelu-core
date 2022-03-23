import { applicationRoundContainer } from "model/recurring-lander";

describe("recurring search lander", () => {
  beforeEach(() => {
    cy.visit("/recurring");
    cy.injectAxe();
    Cypress.config("defaultCommandTimeout", 20000);
  });

  it("displays correct application rounds", () => {
    cy.get("h1").should("contain", "Kausivaraus");

    applicationRoundContainer("active")
      .children("div")
      .should("have.length", 1)
      .find("button")
      .should("contain.text", "Täytä hakemus");
    applicationRoundContainer("active")
      .children("h3")
      .should("contain.text", "Käynnissä olevat haut");

    applicationRoundContainer("pending")
      .children("div")
      .should("have.length", 1)
      .find("button")
      .should("not.exist");
    applicationRoundContainer("pending")
      .children("h3")
      .should("contain.text", "Tulevat haut");

    applicationRoundContainer("past")
      .children("div")
      .should("have.length", 6)
      .find("button")
      .should("not.exist");
    applicationRoundContainer("past")
      .children("h3")
      .should("contain.text", "Päättyneet haut");

    cy.checkA11y(null, null, null, true);

    applicationRoundContainer("active").children("div").find("button").click();

    cy.url().should("contain", "/search?applicationRound=2");
  });
});
