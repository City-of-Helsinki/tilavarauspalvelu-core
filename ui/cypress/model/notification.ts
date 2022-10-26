export function errorNotification(): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get('section[aria-label="Notification"]');
}

export function errorNotificationTitle(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return errorNotification().find("> div > div:first-of-type");
}

export function errorNotificationBody(): Cypress.Chainable<
  JQuery<HTMLElement>
> {
  return errorNotification().find("> div > div:last-of-type");
}
