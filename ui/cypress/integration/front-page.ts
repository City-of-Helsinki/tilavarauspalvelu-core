import {
  browseSingleReservationUnitsButton,
  browseRecurringReservationUnitsButton,
} from "../model/home";

beforeEach(() => {
  cy.visit("/");
});

describe("Tilavaraus ui front page", () => {
  it("displays search guides", () => {
    cy.get('[data-test-id="search-guide__single"] h2').should(
      "contain",
      "Yksittäisvarauksen tekeminen"
    );
    cy.get('[data-test-id="search-guide__recurring"] h2').should(
      "contain",
      "Vakiovuoron hakeminen"
    );
  });

  it("displays browsing buttons", () => {
    browseSingleReservationUnitsButton().should("exist");
    browseRecurringReservationUnitsButton().should("exist");
  });

  it("is accessible", () => {
    cy.a11yCheck();
  });
});
