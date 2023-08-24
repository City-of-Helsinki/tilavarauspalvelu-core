import { notificationTitle } from "../model/application";
import { notificationContainer } from "../model/reservation-creation";
import {
  applicationCard,
  applicationGroups,
  confirmationModal,
} from "../model/applications";

describe("applications", () => {
  beforeEach(() => {
    cy.visit("/applications");
    cy.injectAxe();
  });

  it("can cancel an application", () => {
    const groupData = [
      {
        title: "Käsittelyssä",
        items: 5,
      },
      {
        title: "Luonnokset",
        items: 8,
      },
      {
        title: "Peruttu",
        items: 17,
      },
    ];
    cy.checkA11y(undefined, undefined, undefined, true);

    applicationGroups().should("have.length", 2);
    applicationGroups().each((group, index) => {
      cy.wrap(group).find("h2").should("contain.text", groupData[index].title);
      cy.wrap(group)
        .find("> div")
        .should("have.length", groupData[index].items);
    });

    applicationCard().eq(0).find('button[aria-label="Peru"]').click();
    confirmationModal().should("be.visible");
    confirmationModal().find("button").eq(0).click();
    confirmationModal().should("not.exist");

    applicationCard().eq(0).find('button[aria-label="Peru"]').click();
    confirmationModal().should("be.visible");
    confirmationModal().find("button").eq(1).click();

    cy.contains("Hakemus on peruutettu onnistuneesti.").should("be.visible");
  });

  it("can view an application", () => {
    applicationCard()
      .eq(0)
      .find('> div > button[aria-label="Näytä"]')
      .eq(0)
      .click();

    cy.get("h1").should("contain.text", "Kausivaraushakemus");

    notificationTitle().should("contain.text", "Käsittely");

    notificationContainer().should(
      "contain.text",
      "Hakemusten käsittely aloitetaan, kun hakuaika on päättynyt. Ilmoitamme antamaasi sähköpostiosoitteeseen eri vaiheista."
    );
  });
});
