export function browseAllButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#browseAllButton');
}
