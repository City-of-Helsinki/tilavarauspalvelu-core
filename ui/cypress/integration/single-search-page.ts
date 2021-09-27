import {
  searchButton,
  fullTextInput,
  inputMinPersons,
  inputMaxPersons,
  inputReservationUnitType,
  filterTags,
  filterTag,
  formResetButton,
  paginationButton,
  inputUnitToggler,
  inputUnit,
} from "../model/search";

describe("Tilavaraus ui search page", () => {
  beforeEach(() => {
    cy.fixture("v1/parameters/reservation_unit_type").then((json) => {
      cy.intercept("GET", "/v1/parameters/reservation_unit_type/*", json);
    });

    cy.visit("/single/search");
  });

  const searchTerm = "tila";

  it("contains page name", () => {
    cy.get("h1").should("contain", "Tarkennettu haku");
  });

  it("displays search results by default", () => {
    cy.get("#searchResultList").should("contain", "10 Hakutulosta");
  });

  it("displays search results on demand", () => {
    fullTextInput().should("be.visible");

    fullTextInput().type(searchTerm);
    inputMinPersons()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(3)")
      .click();
    inputMaxPersons()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(4)")
      .click();
    inputReservationUnitType()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();
    inputUnitToggler()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(1)")
      .click();
    inputUnitToggler().siblings("ul").children("li:nth-of-type(3)").click();
    inputUnitToggler().click();
    searchButton().click();

    filterTags().should("contain.text", `"${searchTerm}"`);
    filterTags().should("contain.text", "Henkilömäärä min");
    filterTags().should("contain.text", "Henkilömäärä max");
    filterTags().should("contain.text", "Tilan tyyppi");
    filterTags().should("contain.text", "Toimipiste");
    cy.get("#searchResultList").should("contain", "10 Hakutulosta");

    filterTag("maxPersons").children("button").click();

    filterTags().should("contain.text", `"${searchTerm}"`);
    filterTags().should("contain.text", "Henkilömäärä min");
    filterTags().should("not.contain.text", "Henkilömäärä max");
    filterTags().should("contain.text", "Tilan tyyppi");
    filterTags().should("contain.text", "Toimipiste");
    cy.get("#searchResultList").should("contain", "10 Hakutulosta");

    formResetButton().click();

    filterTags().should("not.exist");
    cy.get("#searchResultList").should("contain", "10 Hakutulosta");
    formResetButton().should("not.be.exist");

    paginationButton().should("exist");

    cy.a11yCheck();
  });
});
