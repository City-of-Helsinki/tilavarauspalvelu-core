export function title(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("h1");
}

export function reasonSelect(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#reservation__button--cancel-reason-toggle-button");
}

export function customReasonInput(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#reservation__button--cancel-description");
}

export function backButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("button[data-testid='reservation-cancel__button--back']");
}

export function cancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("button[data-testid='reservation-cancel__button--cancel']");
}

export function secondBackButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("button[data-testid='reservation-cancel__button--back-front']");
}

export function reReserveButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("button[data-testid='reservation-cancel__button--rereserve']");
}
