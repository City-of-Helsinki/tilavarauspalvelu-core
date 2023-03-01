import { Result } from "axe-core";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      a11yCheck(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

function terminalLog(violations: Result[]) {
  cy.task(
    "log",
    `${violations.length} accessibility violation${
      violations.length === 1 ? "" : "s"
    } ${violations.length === 1 ? "was" : "were"} detected`
  );
  // pluck specific keys to keep the table readable
  const violationData = violations.map(
    ({ id, impact, description, nodes }: Result) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    })
  );

  cy.task("table", violationData);
}

Cypress.Commands.add("a11yCheck", () => {
  cy.injectAxe();
  return cy.checkA11y({ exclude: ["header"] }, undefined, terminalLog); // skip navigation
});
