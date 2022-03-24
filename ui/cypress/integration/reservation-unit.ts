import { error404Body, error404Title } from "model/error";
import { accordion, addressContainer } from "model/reservation-unit";
import { textWithIcon } from "model/search";

describe("Tilavaraus ui reservation unit page (recurring)", () => {
  it("displays default elements", () => {
    cy.visit("/reservation-unit/36");

    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");

    textWithIcon(1).contains("20 € / 15 min");
    textWithIcon(2).contains("Nuorisopalvelut Fi");
    textWithIcon(3).contains("60 henkilöä");

    accordion("description").contains(
      "Sali sijaitsee nuorisotalon toisessa kerroksessa. Tilaan mahtuu 60 henkilöä.."
    );

    accordion("equipment").contains("Tuoli FiKattila FiJoku muu Fi");

    addressContainer().should("have.length", 2);

    addressContainer(1).should("contain", "Säterintie 2 Fi");
    addressContainer(1).should("contain", "00720 Helsinki Fi");
    addressContainer(1).should("contain", "Avaa kartta uuteen ikkunaan");
    addressContainer(1).should("contain", "Google reittiohjeet");
    addressContainer(1).should("contain", "HSL Reittiopas");
  });

  describe("without equipment", () => {
    it("doesn't display equipment accordion", () => {
      cy.visit("/reservation-unit/800");

      accordion("description").contains(
        "Sali sijaitsee nuorisotalon toisessa kerroksessa. Tilaan mahtuu 60 henkilöä.."
      );

      accordion("equipment").should("not.exist");
    });
  });

  describe("with publish times", () => {
    Cypress.config("defaultCommandTimeout", 20000);

    it("should not display unpublished item", () => {
      cy.visit("/reservation-unit/single/905", { failOnStatusCode: false });

      error404Title().should("have.text", "404");
      error404Body().should("have.text", "Sivua ei löytynyt");
    });

    it("should not display unpublished item", () => {
      cy.visit("/reservation-unit/single/906", { failOnStatusCode: false });

      error404Title().should("have.text", "404");
      error404Body().should("have.text", "Sivua ei löytynyt");
    });
  });

  describe("preview", () => {
    Cypress.config("defaultCommandTimeout", 20000);

    it("should display draft item with non-matching publish range", () => {
      cy.visit(
        "/reservation-unit/single/907?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619",
        { failOnStatusCode: false }
      );

      cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
    });

    it("should not display draft item with non-matching publish range without valid uuid", () => {
      cy.visit("/reservation-unit/single/907", { failOnStatusCode: false });

      error404Title().should("have.text", "404");
      error404Body().should("have.text", "Sivua ei löytynyt");
    });

    it("should not display draft item", () => {
      cy.visit("/reservation-unit/single/999", { failOnStatusCode: false });

      error404Title().should("have.text", "404");
      error404Body().should("have.text", "Sivua ei löytynyt");
    });

    it("should display draft item if uuid matches", () => {
      cy.visit(
        "/reservation-unit/single/999?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619"
      );

      cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
    });
  });
});
