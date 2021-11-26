export function tabList(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('ul[role="tablist"]');
}

export function tab(order: number): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`ul[role="tablist"] li:nth-child(${order})`);
}

export function reservationCards(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation__card--container']");
}

export function cancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-card__button--cancel-reservation']");
}

export function detailButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-card__button--goto-reservation']");
}

export function redoReservationButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("[data-testid='reservation-card__button--redo-reservation']");
}

export function timeStrip(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-card__time']");
}

export function ticket(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation__ticket--container']");
}
