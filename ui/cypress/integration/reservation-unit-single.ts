import {
  reservationTimeRange,
  headerCell,
  hzNavigationFwd,
  reservationSubmitButton,
  timeColumn,
  eventLabel,
} from "model/calendar";
import {
  confirmationParagraph,
  reservationConfirmationTimeRange,
  formField,
  reservationTitle,
  updateButton,
  cancelButton,
  calendarUrlLink,
} from "model/reservation";

const drawReservation = (): void => {
  hzNavigationFwd().click();

  timeColumn(0).within(() => {
    cy.get(".rbc-time-slot")
      .eq(6)
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 400, { force: true });
    cy.get(".rbc-time-slot").eq(6).trigger("mouseup", { force: true });
  });
  reservationSubmitButton().should("be.disabled");
  headerCell(0)
    .invoke("text")
    .then((text) => {
      reservationTimeRange()
        .invoke("text")
        .then((resText) => {
          expect(resText.toLowerCase()).to.contain(text);
        });
    });
  eventLabel()
    .invoke("text")
    .then((text) => {
      reservationTimeRange()
        .invoke("text")
        .then((resText) => {
          expect(resText.toLowerCase()).to.contain(text);
        });
    });

  timeColumn(1).within(() => {
    cy.get(".rbc-time-slot")
      .eq(8)
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 40, { force: true });
    cy.get(".rbc-time-slot").eq(6).trigger("mouseup", { force: true });
  });
  reservationSubmitButton().should("not.disabled");
  headerCell(1)
    .invoke("text")
    .then((text) => {
      reservationTimeRange()
        .invoke("text")
        .then((resText) => {
          expect(resText.toLowerCase()).to.contain(text);
        });
    });
  eventLabel()
    .invoke("text")
    .then((text) => {
      reservationTimeRange()
        .invoke("text")
        .then((resText) => {
          expect(resText.toLowerCase()).to.contain(text);
        });
    });
};

describe("Tilavaraus ui reservation unit page (single)", () => {
  Cypress.config("defaultCommandTimeout", 20000);

  beforeEach(() => {
    cy.visit("/reservation-unit/single/48");
  });

  it("allows making a reservation", () => {
    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");

    drawReservation();

    reservationSubmitButton().click();

    const formFieldsNValues = [
      { label: "reserveeFirstName", value: "Etunimi" },
      { label: "reserveeLastName", value: "Sukunimi" },
      { label: "reserveePhone", value: "+3581234567" },
      { label: "name", value: "Varaus" },
      { label: "description", value: "Kuvaus" },
      { label: "spaceTerms" },
      { label: "resourceTerms" },
    ];

    updateButton().click();
    formFieldsNValues.forEach((field) => {
      cy.get(`#${field.label}-error`).should("exist");
    });

    formFieldsNValues.forEach((field) => {
      if (field.value) {
        formField(field.label).type(field.value);
      } else {
        formField(field.label).click();
      }
    });

    formFieldsNValues.forEach((field) => {
      cy.get(`#${field.label}-error`).should("not.exist");
    });

    updateButton().click();

    calendarUrlLink()
      .invoke("attr", "href")
      .should("eq", "http://calendarUrl/42");

    confirmationParagraph()
      .eq(0)
      .find("span")
      .eq(0)
      .should("have.text", "Varauksen nimi (julkinen)")
      .parent()
      .find("span")
      .eq(1)
      .should("have.text", formFieldsNValues[3].value);

    confirmationParagraph()
      .eq(1)
      .find("span")
      .eq(0)
      .should("have.text", "Varaajan nimi")
      .parent()
      .find("span")
      .eq(1)
      .should(
        "have.text",
        `${formFieldsNValues[0].value} ${formFieldsNValues[1].value}`
      );

    confirmationParagraph()
      .eq(2)
      .find("span")
      .eq(0)
      .should("have.text", "Varauksen kuvaus")
      .parent()
      .find("span")
      .eq(1)
      .should("have.text", formFieldsNValues[4].value);

    confirmationParagraph()
      .eq(3)
      .find("span")
      .eq(0)
      .should("have.text", "Varauksen ajankohta")
      .parent()
      .find("span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        reservationConfirmationTimeRange().should("contain.text", text);
      });

    confirmationParagraph()
      .eq(4)
      .find("span")
      .eq(0)
      .should("have.text", "Tila")
      .parent()
      .find("span")
      .eq(1)
      .invoke("text")
      .then((text) => {
        reservationTitle().should("have.text", text);
      });

    confirmationParagraph()
      .eq(5)
      .find("span")
      .eq(0)
      .should("have.text", "Puhelin")
      .parent()
      .find("span")
      .eq(1)
      .should("have.text", formFieldsNValues[2].value);
  });

  it("can cancel reservation process", () => {
    drawReservation();

    reservationSubmitButton().click();

    cancelButton().click();

    cy.url().should("contain", "/reservation-unit/single/48");
  });
});
