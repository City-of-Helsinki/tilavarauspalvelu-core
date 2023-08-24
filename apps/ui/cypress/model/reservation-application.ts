export function reserveeTypeNonprofitButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("input#nonprofit");
}

export function reserveeTypeIndividualButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("input#individual");
}

export function reserveeTypeBusinessButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("input#business");
}
