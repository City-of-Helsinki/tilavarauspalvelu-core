export function accordion(
  modifier: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-testid="reservation-unit__accordion--${modifier}"]`);
}

export function description(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__description"]');
}

export function equipment(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__equipment"]');
}

export function reservationInfo(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__reservation-info"]');
}

export function reservationNotice(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__reservation-notice"]');
}

export function paymentAndCancellationTerms(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get(
    '[data-testid="reservation-unit__payment-and-cancellation-terms"]'
  );
}

export function pricingTerms(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__pricing-terms"]');
}

export function termsOfUse(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-testid="reservation-unit__terms-of-use"]');
}

export function reservationControls(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    '[data-testid="reservation-unit__reservation-controls--wrapper"]'
  );
}

export function addressContainer(
  order?: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  const element = cy.get(
    "[data-testid='reservation-unit__address--container']"
  );
  return order ? element.eq(order) : element;
}
