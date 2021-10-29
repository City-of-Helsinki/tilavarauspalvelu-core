export function formField(
  name: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`input[name="${name}"]`);
}

export function updateButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('button[data-test="reservation__button--update"]', {
    timeout: 20000,
  });
}

export function cancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('button[data-test="reservation__button--cancel"]', {
    timeout: 20000,
  });
}

export function confirmationParagraph(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('p[data-test="reservation__confirmation--paragraph"]');
}

export function reservationConfirmationTimeRange(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('[data-test="reservation__time-range"]');
}

export function reservationTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-test="reservation__title"]');
}

export function calendarUrlLink(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-test="reservation__confirmation--calendar-url"]');
}
