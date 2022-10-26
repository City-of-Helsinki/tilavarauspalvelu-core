export function formField(
  name: string,
  type = "input"
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`${type}[name="${name}"]`);
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

export function calendarUrlButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    '[data-testid="reservation__confirmation--button__calendar-url"]'
  );
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

export function reservationStartNotification(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get(
    '[data-testid="reservation-unit--notification__reservation-start"]'
  );
}

export function reservationQuotaNotification(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get(
    '[data-testid="reservation-unit--notification__reservation-quota"]'
  );
}

export function calendarWrapper(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__calendar--wrapper"]');
}

export function reserveeTypeSelector(
  order: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .get('[data-testid="reservation__checkbox--reservee-type"] > button')
    .eq(order);
}
