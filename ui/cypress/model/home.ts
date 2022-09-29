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

export function unitLinkSearchForm(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="front-page__units--more-link"]');
}
