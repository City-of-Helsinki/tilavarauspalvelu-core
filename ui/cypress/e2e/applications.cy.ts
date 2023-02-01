import { applicationGroups, confirmationModal } from "model/applications";

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

    applicationGroups()
      .eq(0)
      .find('> div button[aria-label="Peru hakemus"]')
      .click();
    confirmationModal().should("be.visible");
    confirmationModal().find("button").eq(0).click();
    confirmationModal().should("not.exist");

    applicationGroups()
      .eq(0)
      .find('> div button[aria-label="Peru hakemus"]')
      .click();
    confirmationModal().should("be.visible");
    confirmationModal().find("button").eq(1).click();

    cy.contains("Hakemus on peruutettu onnistuneesti.").should("be.visible");
  });
});
