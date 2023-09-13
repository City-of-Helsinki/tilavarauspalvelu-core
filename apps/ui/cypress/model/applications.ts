export function applicationGroups(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='applications__group--wrapper']");
}

export function confirmationModal(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#application-card-modal");
}

export function applicationCard(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='applications__card--wrapper']");
}
