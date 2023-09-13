export function hzNavigationBack(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".rbc-toolbar-navigation-hz > button:first-of-type");
}

export function hzNavigationFwd(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".rbc-toolbar-navigation-hz > button:nth-of-type(2)");
}

export function timeColumn(
  order: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".rbc-time-column:not(.rbc-time-gutter)").eq(order);
}

export function reservationSubmitButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("button[data-test='reservation__button--submit']");
}

export function headerCell(
  order: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".rbc-time-header-content > .rbc-row > .rbc-header").eq(order);
}

export function reservationTimeRange(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('[data-test="reservation__selection--timerange"]');
}

export function eventLabel(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".rbc-event-label");
}
