import "cypress-axe";
import "./commands";

beforeEach(() => {
  cy.on("uncaught:exception", (err) => {
    if (err.message.indexOf("ResizeObserver") !== -1) {
      return false;
    }
    return true;
  });
});
