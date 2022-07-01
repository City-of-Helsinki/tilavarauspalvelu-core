import { checkBreadcrumbs } from "model/breadcrumb";
import {
  searchButton,
  fullTextInput,
  inputMinPersons,
  inputMaxPersons,
  inputReservationUnitType,
  inputReservationUnitTypeOption,
  inputUnitToggler,
  inputUnitOption,
  inputUnit,
  selectOptions,
  selectClearButton,
  inputPurposeToggler,
  inputPurposeOption,
  inputPurpose,
  filterTags,
  filterTag,
  formResetButton,
  paginationButton,
  filterToggleButton,
} from "../model/search";

describe("Tilavaraus ui search page (recurring)", () => {
  beforeEach(() => {
    cy.visit("/search");
  });

  const searchTerm = "haku";

  it("contains page name", () => {
    cy.get("h1").should("contain", "Varaa tila koko kaudeksi");
  });

  it("displays search results when search button is clicked", () => {
    fullTextInput().type("search terms");
    searchButton().click();
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");
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

    filterTags().should("contain.text", `${searchTerm}`);
    filterTags().should("contain.text", "Vähintään 2 hlö");
    filterTags().should("contain.text", "Enintään 5 hlö");
    filterTags().should("contain.text", "Äänitysstudio");
    filterTags().should("contain.text", "Tila #1");
    filterTags().should("contain.text", "Tila #3");
    filterTags().should("contain.text", "Purpose #1");
    filterTags().should("contain.text", "Purpose #3");
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");

    filterTag("maxPersons").children("button").click();

    filterTags().should("contain.text", `${searchTerm}`);
    filterTags().should("contain.text", "Vähintään 2 hlö");
    filterTags().should("not.contain.text", "Enintään 5 hlö");
    filterTags().should("contain.text", "Äänitysstudio");
    filterTags().should("contain.text", "Tila #1");
    filterTags().should("contain.text", "Tila #3");
    filterTags().should("contain.text", "Purpose #1");
    filterTags().should("contain.text", "Purpose #3");
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");

    formResetButton().click();

    filterTags().should("not.exist");
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");
    formResetButton().should("not.be.exist");

    paginationButton().should("exist");

    cy.a11yCheck();
  });

  it("search results is accessible", () => {
    cy.a11yCheck();
    fullTextInput().type("search terms");
    searchButton().click();
    cy.a11yCheck();
  });

  it("displays correct breadcrumbs", () => {
    const breadcrumbs = {
      fi: [
        { title: "Etusivu", url: "/" },
        { title: "Kausivaraus", url: "/recurring" },
        { title: "Haku" },
      ],
      en: [
        { title: "Home", url: "/en" },
        { title: "Seasonal booking", url: "/en/recurring" },
        { title: "Search" },
      ],
      sv: [
        { title: "Hemsidan", url: "/sv" },
        { title: "Säsongbokning", url: "/sv/recurring" },
        { title: "Sök" },
      ],
    };

    checkBreadcrumbs(breadcrumbs, "/search");
  });

  it("handles mobile features", () => {
    cy.viewport("iphone-x");

    fullTextInput().should("be.visible");
    inputMinPersons().should("not.be.visible");
    inputMaxPersons().should("not.be.visible");
    inputReservationUnitType().should("not.be.visible");
    inputUnitToggler().should("not.be.visible");
    inputPurposeToggler().should("not.be.visible");

    filterToggleButton().click();

    fullTextInput().should("be.visible");
    inputMinPersons().should("be.visible");
    inputMaxPersons().should("be.visible");
    inputReservationUnitType().should("be.visible");
    inputUnitToggler().should("be.visible");
    inputPurposeToggler().should("be.visible");

    filterToggleButton().click();

    fullTextInput().should("be.visible");
    inputMinPersons().should("not.be.visible");
    inputMaxPersons().should("not.be.visible");
    inputReservationUnitType().should("not.be.visible");
    inputUnitToggler().should("not.be.visible");
    inputPurposeToggler().should("not.be.visible");

    cy.a11yCheck();
  });
});
