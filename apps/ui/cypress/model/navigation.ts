export function languageSelector(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(".navigation__language-selector--button").last();
}

export function languageSelectorMenu(): Cypress.Chainable<JQuery<HTMLElement>> {
  return languageSelector().find("#languageSelector-menu");
}

export function languageSelectorMenuItem(
  lang: string
): Cypress.Chainable<JQuery<HTMLElement>> {
  return languageSelectorMenu().find(`a[lang='${lang}']`);
}
