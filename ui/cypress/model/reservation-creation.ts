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

export function dateSelector(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#reservation__input--date");
}

export function startTimeSelectorToggle(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#reservation__input--start-time-toggle-button");
}

export function durationSelectorToggle(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#reservation__input--duration-toggle-button");
}

export function reservationInfoPrice(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation__price--value']");
}

export function reservationEvent(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".rbc-event.rbc-event-movable");
}

export function notificationContainer(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('[aria-label="Notification"]');
}

export function notificationCloseButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('[aria-label="Sulje virheilmoitus"]');
}
