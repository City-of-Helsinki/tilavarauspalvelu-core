import { browseAllButton } from "../model/home";

describe("Tilavaraus ui front page", () => {
  beforeEach(() => {
    cy.fixture("v1/application_round").then((json) => {
      cy.intercept("GET", "/v1/application_round/*", json);
    });
    cy.visit("/");
  });

  it("displays applicationRounds", () => {
    cy.get("h1").should("contain", "Vakiovuoron hakeminen");
  });

  it("displays browse all button", () => {
    browseAllButton().should("exist");
  });

  it("is accessible", () => {
    cy.a11yCheck();
  });
});
