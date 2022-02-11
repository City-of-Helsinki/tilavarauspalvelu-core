export function addressContainer(
  order?: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  const element = cy.get(
    "[data-testid='reservation-unit__address--container']"
  );
  return order ? element.eq(order) : element;
}
