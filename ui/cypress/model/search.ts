export function searchButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#searchButton');
}

export function fullTextInput(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#search');
}

export function addReservationUnitButton(
  name: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .get('#searchResultList > div > div')
    .filter((i, e) => e.innerHTML.indexOf(name) !== -1)
    .first()
    .find('button:not(:disabled)').should('be.visible');
}

export function startApplicationButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('#startApplicationButton').should('be.visible');
}
