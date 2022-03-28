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
  inputUnitOption,
  inputPurposeToggler,
  inputPurposeOption,
  inputUnit,
  selectOptions,
  inputPurpose,
  selectClearButton,
  inputReservationUnitTypeOption,
  reservationUnitCards,
} from "../model/search";

describe("Tilavaraus ui search page (single)", () => {
  beforeEach(() => {
    cy.fixture("v1/parameters/reservation_unit_type").then((json) => {
      cy.intercept("GET", "/v1/parameters/reservation_unit_type/*", json);
    });

    cy.visit("/search/single");
  });

  const searchTerm = "tila";

  it("contains page name", () => {
    cy.get("h1").should("contain", "Varaa tiloja ja laitteita");
  });

  it("displays search results by default", () => {
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");

    reservationUnitCards(1).contains("12,34 - 20 € / t");
    reservationUnitCards(1).contains("Arabianpolku 1 A 2");
    reservationUnitCards(1).contains("Nuorisopalvelut");
    reservationUnitCards(1).contains("100");
    reservationUnitCards(2).contains("0 - 20 € / ½ p");
    reservationUnitCards(3).contains("Maksuton");
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
    inputReservationUnitType().click();
    inputReservationUnitTypeOption(1).click();
    inputReservationUnitType().click();

    inputUnitToggler().click();
    inputUnitOption(1).click();
    inputUnitOption(3).click();
    inputUnit().type("2");
    expect(selectOptions("#unitFilter").should("have.length", 1));
    selectClearButton("#unitFilter").click();
    expect(selectOptions("#unitFilter").should("have.length", 3));
    inputUnitOption(1).click();
    inputUnitOption(3).click();
    inputUnitToggler().click();

    inputPurposeToggler().click();
    inputPurposeOption(1).click();
    inputPurposeOption(3).click();
    inputPurpose().type("1");
    expect(selectOptions("#purposeFilter").should("have.length", 2));
    selectClearButton("#purposeFilter").click();
    expect(selectOptions("#purposeFilter").should("have.length", 4));
    inputPurposeOption(1).click();
    inputPurposeOption(3).click();
    inputPurposeToggler().click();

    searchButton().click();

    filterTags().should("contain.text", `"${searchTerm}"`);
    filterTags().should("contain.text", "Henkilömäärä min");
    filterTags().should("contain.text", "Henkilömäärä max");
    filterTags().should("contain.text", "Tilan tyyppi");
    filterTags().should("contain.text", "Toimipiste");
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");

    filterTag("maxPersons").children("button").click();

    filterTags().should("contain.text", `"${searchTerm}"`);
    filterTags().should("contain.text", "Henkilömäärä min");
    filterTags().should("not.contain.text", "Henkilömäärä max");
    filterTags().should("contain.text", "Tilan tyyppi");
    filterTags().should("contain.text", "Toimipiste");
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");

    formResetButton().click();

    filterTags().should("not.exist");
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");
    formResetButton().should("not.be.exist");

    paginationButton().should("exist");

    cy.a11yCheck();
  });
});
