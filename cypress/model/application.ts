export function selectApplicationRoundButton(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('#applicationRoundSelect-toggle-button');
}

export function firstAvailableApplicationRound(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return cy.get('#applicationRoundSelect-item-0');
}

export function proceedToPage1Button(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#start-application');
}

export function applicationName(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#applicationEvents\\[0\\]\\.name');
}

export function numPersons(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#applicationEvents\\[0\\]\\.numPersons');
}

export function selectOption(id: string, itemIndex: number): void {
  cy.get(`#${CSS.escape(`${id}-toggle-button`)}`).click();
  cy.get(`#${CSS.escape(`${id}-item-${itemIndex}`)}`).click();
}

export function acceptAndSaveEvent(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`#${CSS.escape('applicationEvents[0].save')}`);
}

export function nextButton(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('#next:not(:disabled)').should('be.visible');
}

const random = {
  randomInt: (max) => Math.floor(Math.random() * Math.floor(max)),
};

export function randomApplicationEventScheduleButton() {
  const rnd = random.randomInt(7 * 17);
  const button = cy.get('#timeSelector-0 > div > div > button');
  return button.filter((i) => i === rnd).first();
}

export function fillAsIndividual() {
  cy.get('[for="individual"]').click();
  cy.get('#contactPerson\\.firstName').type('Vuoron');
  cy.get('#contactPerson\\.lastName').type('Hakija');
  cy.get('#billingAddress\\.streetAddress').type('Jokukatu 5');
  cy.get('#billingAddress\\.postCode').type('00100');
  cy.get('#billingAddress\\.city').type('Helsinki');
  cy.get('#contactPerson\\.phoneNumber').type('040-555 555');
  cy.get('#contactPerson\\.email').type('email@address.invalid');
}

export function acceptTerms() {
  cy.get('[for="preview\\.acceptTermsOfUse"]').first().click({force:true});
}

export function submitApplication() {
  cy.get('#submit').click();
}
