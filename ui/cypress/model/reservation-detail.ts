export function modifyButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-detail__button--edit']");
}

export function cancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-detail__button--cancel']");
}

export function returnButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-detail__button--return']");
}

export function accordionToggler(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("div[role='button']");
}

export function reservationDetail(
  slug: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-testid='reservation__detail--${slug}']`);
}
