export function browseSingleReservationUnitsButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#browseSingleReservationUnits");
}

export function browseRecurringReservationUnitsButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#browseRecurringReservationUnits");
}
