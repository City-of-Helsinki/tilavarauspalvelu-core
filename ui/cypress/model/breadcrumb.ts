import {
  languageSelector,
  languageSelectorMenu,
  languageSelectorMenuItem,
} from "model/navigation";

type langs = "fi" | "sv" | "en";

type BreadcrumbsByLang = {
  [key in langs]: Breadcrumb[];
};

type Breadcrumb = {
  title: string;
  url?: string;
};

export const checkBreadcrumbs = (
  breadcrumbs: BreadcrumbsByLang,
  url: string
) => {
  const validateBreadcrumbContent = (
    root: Cypress.Chainable<JQuery<HTMLElement>>,
    breadcrumbs: Breadcrumb[]
  ) => {
    root
      .find("> div")
      .each((el: Cypress.Chainable<JQuery<HTMLElement>>, index: number) => {
        if (breadcrumbs[index].url) {
          const anchor = el.find("a");
          cy.wrap(anchor).should("contain.text", breadcrumbs[index].title);
          cy.wrap(anchor).should(
            "have.attr",
            "title",
            breadcrumbs[index].title
          );
          cy.wrap(anchor).should("have.attr", "href", breadcrumbs[index].url);
        } else {
          const span = el.find("span");
          cy.wrap(span).should("contain.text", breadcrumbs[index].title);
          cy.wrap(span).should("have.attr", "title", breadcrumbs[index].title);
        }
      });
  };

  Object.keys(breadcrumbs).forEach((key: string) => {
    const keyString = key === "fi" ? "" : `/${key}`;
    cy.visit(`${keyString}${url}`);

    validateBreadcrumbContent(breadcrumbWrapper(), breadcrumbs[key]);
  });
};

export function breadcrumbWrapper(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='breadcrumb__wrapper']");
}
