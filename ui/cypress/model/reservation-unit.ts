export function accordion(
  modifier: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-testid="reservation-unit__accordion--${modifier}"]`);
}

export function addressContainer(
  order?: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  const element = cy.get(
    "[data-testid='reservation-unit__address--container']"
  );
  return order ? element.eq(order) : element;
}
