export function languageSelector(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#languageSelector-button");
}

export function languageSelectorMenu(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get("#languageSelector-menu");
}

export function languageSelectorMenuItem(
  lang: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return languageSelectorMenu().find(`a[lang='${lang}']`);
}
