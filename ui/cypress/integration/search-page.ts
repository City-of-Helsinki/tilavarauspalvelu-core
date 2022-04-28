import { checkBreadcrumbs } from "model/breadcrumb";
import { searchButton, fullTextInput } from "../model/search";

describe("Tilavaraus ui search page (recurring)", () => {
  beforeEach(() => {
    cy.visit("/search");
  });

  it("contains page name", () => {
    cy.get("h1").should("contain", "Varaa tila koko kaudeksi");
  });

  it("displays search results when search button is clicked", () => {
    fullTextInput().type("search terms");
    searchButton().click();
    cy.get("#searchResultList").should("not.contain", "10 Hakutulosta");
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
});
