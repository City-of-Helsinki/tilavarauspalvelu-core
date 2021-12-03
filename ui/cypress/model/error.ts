export function error404Title(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('h1[data-testid="error__404--title"]');
}

export function error404Body(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('p[data-testid="error__404--body"]');
}
