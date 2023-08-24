export function applicationRoundContainer(
  modifier: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `[data-testid="recurring-lander__application-round-container--${modifier}"]`
  );
}
