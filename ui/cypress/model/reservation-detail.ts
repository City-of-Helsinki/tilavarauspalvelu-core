export function cancelButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-detail__button--cancel']");
}

export function returnButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation-detail__button--return']");
}

export function accordionToggler(
  id: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`div[data-testid='${id}'] > button[type='button']`);
}

export function reservationContent(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation__content']");
}

export function reservationDetail(
  slug: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-testid='reservation__detail--${slug}']`);
}

export function reservationPriceContainer(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("[data-testid='reservation__price--container']");
}

export function reservationInfoCard(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation__reservation-info-card__content']");
}

export function calendarLinkButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("[data-testid='reservation__button--calendar-link']");
}
