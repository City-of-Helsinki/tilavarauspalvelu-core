import {
  browseSingleReservationUnitsButton,
  browseRecurringReservationUnitsButton,
} from "../model/home";

describe("Tilavaraus ui front page", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.injectAxe();
  });

  it("displays search guides", () => {
    cy.get('[data-test-id="search-guide__single"] h2').should(
      "contain",
      "Yksittäisvarauksen tekeminen"
    );
    cy.get('[data-test-id="search-guide__recurring"] h2').should(
      "contain",
      "Kausivarauksen tekeminen"
    );
  });

  it("displays browsing buttons", () => {
    browseSingleReservationUnitsButton().should("not.exist");
    browseRecurringReservationUnitsButton().should("exist");
  });

  it("is accessible", () => {
    cy.checkA11y(null, null, null, true);
  });
});
