export function searchButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#searchButton");
}

export function fullTextInput(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#search");
}

export function addReservationUnitButton(
  name: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .get("#searchResultList > div > div")
    .filter((i, e) => e.innerHTML.indexOf(name) !== -1)
    .first()
    .find("button:not(:disabled)")
    .should("be.visible");
}

export function startApplicationButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#startApplicationButton").should("be.visible");
}

export function inputMinPersons(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#participantMinCountFilter-toggle-button");
}

export function inputMaxPersons(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#participantMaxCountFilter-toggle-button");
}

export function inputReservationUnitType(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#reservationUnitTypeFilter-toggle-button");
}

export function inputUnit(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#unitFilter-input");
}

export function inputUnitToggler(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#unitFilter-toggle-button");
}

export function filterTags(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-test-id="search-form__filter--tags"]');
}

export function filterTag(tag: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`#filter-tag__${tag}`);
}

export function formResetButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-test-id='search-form__reset-button']");
}

export function paginationButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-test-id='search-form__pagination-button']");
}
