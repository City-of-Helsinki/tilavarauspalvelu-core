import { addressContainer } from "model/reservation-unit";
import { textWithIcon } from "model/search";

describe("Tilavaraus ui reservation unit page (recurring)", () => {
  beforeEach(() => {
    cy.visit("/reservation-unit/36");
  });

  it("displays default elements", () => {
    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");

    textWithIcon(1).contains("Nuorisopalvelut Fi");
    textWithIcon(2).contains("60 henkilöä");

    addressContainer().should("have.length", 2);

    addressContainer(1).should("contain", "Säterintie 2 Fi");
    addressContainer(1).should("contain", "00720 Helsinki Fi");
    addressContainer(1).should("contain", "Avaa kartta uuteen ikkunaan");
    addressContainer(1).should("contain", "Google reittiohjeet");
    addressContainer(1).should("contain", "HSL Reittiopas");
  });
});
