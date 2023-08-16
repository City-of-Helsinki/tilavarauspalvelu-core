export function browseSingleReservationUnitsButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#browseSingleReservationUnits");
}

export function browseRecurringReservationUnitsButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#browseRecurringReservationUnits");
}

export function unitLinks(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="front-page__units--unit"]');
}

export function purposeLinks(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="front-page__purposes--purpose"]');
}

export function unitLinkSearchForm(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="front-page__units--more-link"]');
}

export function purposeMoreLink(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="front-page__purposes--more-link"]');
}

export function purposeLessLink(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="front-page__purposes--less-link"]');
}