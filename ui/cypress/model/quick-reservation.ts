type viewType = "mobile" | "desktop";

export function dateSelect(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#desktop-quick-reservation-date");
}

export function timeSelect(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#desktop-quick-reservation-time");
}

export function durationSelect(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#desktop-quick-reservation-duration-toggle-button");
}

export function price(
  viewType: viewType
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `#quick-reservation-${viewType} [data-testid="quick-reservation-price"]`
  );
}

export function nextAvailableTimeLink(
  viewType: viewType
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `#quick-reservation-${viewType} [data-testid="quick-reservation-next-available-time"]`
  );
}

export function carouselButton(
  viewType: viewType,
  label: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `#quick-reservation-${viewType} [data-testid="slot-carousel-button"][aria-label="${label}"]`
  );
}

export function timeSlots(
  viewType: viewType
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `#quick-reservation-${viewType} [data-testid="quick-reservation-slot"]`
  );
}

export function submitButton(
  viewType: viewType
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `#quick-reservation-${viewType} [data-test="quick-reservation__button--submit"]`
  );
}
