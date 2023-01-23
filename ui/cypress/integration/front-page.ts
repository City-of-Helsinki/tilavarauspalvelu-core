import {
  browseSingleReservationUnitsButton,
  browseRecurringReservationUnitsButton,
  unitLinks,
  unitLinkSearchForm,
  purposeLinks,
  purposeMoreLink,
} from "../model/home";

describe("Tilavaraus ui front page", () => {
  beforeEach(() => {
    Cypress.config("defaultCommandTimeout", 20000);
    cy.visit("/");
    cy.injectAxe();
  });

  it("displays purpose links on desktop", () => {
    purposeLinks().should("have.length", 8);

    purposeMoreLink()
      .click()
      .then(() => {
        purposeLinks().should("have.length", 9);
      });

    purposeMoreLink()
      .click()
      .then(() => {
        purposeLinks().should("have.length", 8);
      });
  });

  it("displays purpose links on mobile", () => {
    cy.viewport("iphone-6");

    purposeLinks().should("have.length", 4);

    purposeMoreLink()
      .click()
      .then(() => {
        purposeLinks().should("have.length", 9);
      });

    purposeMoreLink()
      .click()
      .then(() => {
        purposeLinks().should("have.length", 4);
      });

    purposeLinks().eq(3).click();
    cy.url().should("match", new RegExp("purposes=4$"));
  });

  it("displays unit links", () => {
    const links = unitLinks();

    links.should("have.length", 8);

    links.eq(4).should("have.text", "Tila #5").click();
    cy.url().should("contain", "?unit=5");
  });

  it("follows general units link", () => {
    unitLinkSearchForm().click();
    cy.url().should("match", new RegExp("/search/single$"));
  });

  it("displays search guide", () => {
    cy.get('[data-test-id="search-guide__recurring"] h3').should(
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
