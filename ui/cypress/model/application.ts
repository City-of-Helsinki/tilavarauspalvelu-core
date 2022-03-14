export function selectApplicationRoundButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#applicationRoundSelect-toggle-button");
}

export function firstAvailableApplicationRound(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("#applicationRoundSelect-item-0");
}

export function addNewApplicationButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get("button#addApplicationEvent");
}

export function proceedToPage1Button(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#start-application");
}

export function applicationName(
  index: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`#applicationEvents\\[${index}\\]\\.name`);
}

export function numPersons(
  index: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`#applicationEvents\\[${index}\\]\\.numPersons`);
}

export function selectOption(id: string, itemIndex: number): void {
  cy.get(`#${CSS.escape(`${id}-toggle-button`)}`).click();
  cy.get(`#${CSS.escape(`${id}-item-${itemIndex}`)}`).click();
}

export function acceptAndSaveEvent(
  index: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`#${CSS.escape(`applicationEvents[${index}].save`)}`);
}

export function nextButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#next:not(:disabled)").should("be.visible");
}

export function applicationEventAccordion(
  index: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`div#timeSelector-${index}`);
}

export function timeSelectorButton(
  index: number,
  hour: number,
  day: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `#timeSelector-${index} button[data-testid="time-selector__button--${hour}-${day}"]`
  );
}

export function selectPriority(index: number, itemIndex: number): void {
  cy.get(
    `#${CSS.escape(`time-selector__select--priority-${index}`)}-toggle-button`
  ).click();
  cy.get(
    `#${CSS.escape(
      `time-selector__select--priority-${index}-item-${itemIndex}`
    )}`
  ).click();
}

export function timeSummary(
  index: number,
  column: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(
    `div[data-testid="time-selector__preview-${index}"] > div > div:nth-child(${
      column + 1
    })`
  );
}

export function resetButton(
  index: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`button#time-selector__button--reset-${index}`);
}

export function copyCellsButton(
  index: number
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`button#time-selector__button--copy-cells-${index}`);
}

export function notificationTitle(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("section[aria-label='Notification'] div[role='heading']");
}

export function fillAsIndividual() {
  cy.get('[for="individual"]').click();
  cy.get("#contactPerson\\.firstName").type("Vuoron");
  cy.get("#contactPerson\\.lastName").type("Hakija");
  cy.get("#billingAddress\\.streetAddress").type("Jokukatu 5");
  cy.get("#billingAddress\\.postCode").type("00100");
  cy.get("#billingAddress\\.city").type("Helsinki");
  cy.get("#contactPerson\\.phoneNumber").type("040-555 555");
  cy.get("#contactPerson\\.email").type("email@address.invalid");
}

export function acceptTerms() {
  cy.get('[for="preview\\.acceptTermsOfUse"]').first().click({ force: true });
}

export function submitApplication() {
  cy.get("#submit").click();
}
