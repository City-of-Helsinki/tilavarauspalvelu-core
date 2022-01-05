import { addDays, addHours, addMinutes, endOfWeek, format } from "date-fns";
import {
  hzNavigationBack,
  hzNavigationFwd,
  reservationSubmitButton,
  timeColumn,
} from "model/calendar";
import { error404Body, error404Title } from "model/error";
import {
  confirmationParagraph,
  reservationConfirmationTimeRange,
  formField,
  reservationTitle,
  updateButton,
  cancelButton,
  calendarUrlLink,
  reservationInfoPrice,
  dateSelector,
  reservationEvent,
  durationSelectorToggle,
  notificationCloseButton,
  startTimeSelectorToggle,
  notificationContainer,
  reservationStartNotification,
  gotoCalendarButton,
  calendarWrapper,
  reservationQuotaNotification,
} from "model/reservation-creation";
import { textWithIcon } from "model/search";

const matchEvent = (): void => {
  reservationEvent()
    .find(".rbc-event-label")
    .invoke("text")
    .then((text) => {
      const eventText = text.startsWith("0") ? text.substring(1) : text;
      startTimeSelectorToggle()
        .invoke("text")
        .then((startTimeLabel) => {
          durationSelectorToggle()
            .invoke("text")
            .then((duration) => {
              const [hours, minutes] = startTimeLabel.split(".");
              const startTime = `${hours}.${minutes}`;
              const [durationHours, durationMinutes] = duration.split(":");
              const endTime = format(
                addMinutes(
                  addHours(
                    new Date().setHours(Number(hours), Number(minutes)),
                    Number(durationHours)
                  ),
                  Number(durationMinutes)
                ),
                "H.mm"
              );
              expect(eventText).to.eq(`${startTime} – ${endTime}`);
            });
        });
    });
};

const drawReservation = (): void => {
  hzNavigationFwd().click();

  timeColumn(0).within(() => {
    cy.get(".rbc-time-slot")
      .eq(12)
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 400, { force: true });
    cy.get(".rbc-time-slot").eq(6).trigger("mouseup", { force: true });
  });
  reservationSubmitButton().should("be.disabled");

  timeColumn(1).within(() => {
    cy.get(".rbc-time-slot")
      .eq(12)
      .trigger("mousedown", { force: true, button: 0 })
      .trigger("mousemove", 0, 40, { force: true });
    cy.get(".rbc-time-slot").eq(16).trigger("mouseup", { force: true });
  });
  reservationSubmitButton().should("not.disabled");
  matchEvent();
};

describe("Tilavaraus ui reservation unit page (single)", () => {
  Cypress.config("defaultCommandTimeout", 20000);

  beforeEach(() => {
    cy.visit("/reservation-unit/single/1");
    cy.injectAxe();
  });

  it("allows making a reservation", () => {
    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");

    textWithIcon(1).contains("Seuraavat vapaat 1 tunti 30 minuuttia:");
    textWithIcon(2).contains("20 € / 15 min");
    textWithIcon(3).contains("Min 1 tunti");
    textWithIcon(3).contains("Max 1 tunti 30 minuuttia");
    textWithIcon(4).contains("Nuorisopalvelut Fi");
    textWithIcon(5).contains("60 henkilöä");

    gotoCalendarButton().should("exist");

    calendarWrapper().should("exist");

    reservationQuotaNotification().should("not.exist");

    drawReservation();

    reservationInfoPrice()
      .invoke("text")
      .then((text) => {
        expect(text).to.contain("100\u00a0€");
      });

    cy.checkA11y(null, null, null, true);

    reservationSubmitButton().click();

    const form1 = [
      { label: "reserveeFirstName", value: "Etunimi" },
      { label: "reserveeLastName", value: "Sukunimi" },
      { label: "reserveePhone", value: "+3581234567" },
      { label: "name", value: "Varaus" },
      { label: "description", value: "Kuvaus" },
    ];

    const form2 = [{ label: "spaceTerms" }, { label: "resourceTerms" }];

    updateButton().click();
    form1.forEach((field) => {
      cy.get(`#${field.label}-error`).should("exist");
    });

    form1.forEach((field) => {
      formField(field.label).type(field.value);
    });

    form1.forEach((field) => {
      cy.get(`#${field.label}-error`).should("not.exist");
    });

    cy.checkA11y(null, null, null, true);

    updateButton().click();

    form2.forEach((field) => {
      formField(field.label).click();
    });

    updateButton().click();

    calendarUrlLink()
      .invoke("attr", "href")
      .should("eq", "http://calendarUrl/42");

    cy.contains("h2", "Varauksen ohjeet").should("be.visible");
    cy.contains("p", "Additional instructions FI").should("be.visible");

    confirmationParagraph()
      .eq(0)
      .find("span")
      .eq(0)
      .should("have.text", "Varauksen nimi (julkinen)")
      .parent()
      .find("span")
      .eq(1)
      .should("have.text", form1[3].value);

    confirmationParagraph()
      .eq(1)
      .find("span")
      .eq(0)
      .should("have.text", "Varaaja")
      .parent()
      .find("span")
      .eq(1)
      .should("have.text", `${form1[0].value} ${form1[1].value}`);

    confirmationParagraph()
      .eq(2)
      .find("span")
      .eq(0)
      .should("have.text", "Varauksen kuvaus")
      .parent()
      .find("span")
      .eq(1)
      .should("have.text", form1[4].value);

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
      .should("have.text", form1[2].value);

    cy.contains("button", "Siirry omiin varauksiin").click();

    cy.url().should("contain", "/reservations");

    cy.checkA11y(null, null, null, true);
  });

  it("can cancel reservation process", () => {
    drawReservation();

    cy.checkA11y(null, null, null, true);

    reservationSubmitButton().click();

    cy.checkA11y(null, null, null, true);

    cancelButton().click();

    hzNavigationBack().should("exist");

    cy.url().should("contain", "/reservation-unit/single/1");

    reservationEvent().should("not.exist");
  });

  it("can do the reservation with form inputs", () => {
    const today = format(new Date(), "d.M.yyyy");
    dateSelector()
      .invoke("val")
      .then((value) => {
        expect(value).to.eq(today);
      });

    dateSelector()
      .parent()
      .find('button[aria-label="Valitse päivämäärä"]')
      .click();

    dateSelector()
      .parent()
      .find('select[aria-label="Kuukausi"]')
      .invoke("val")
      .then((value) => {
        expect(value).to.eq(new Date().getMonth().toString());
      });

    dateSelector()
      .parent()
      .find('button[aria-label="Seuraava kuukausi"]')
      .click();

    dateSelector()
      .parent()
      .find('select[aria-label="Kuukausi"]')
      .invoke("val")
      .then((value) => {
        const monthNow = new Date().getMonth();
        const monthNext = monthNow === 11 ? 0 : monthNow + 1;
        expect(value).to.eq(monthNext.toString());
      });

    const nextWeek = format(
      endOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
      "d.M.yyyy"
    );

    dateSelector().clear().type(nextWeek);

    startTimeSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(6)")
      .click();
    matchEvent();

    notificationContainer().should("not.exist");

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();

    notificationContainer().contains(
      "Varauksen puskuriajan vaatimukset eivät täyty. Valitse toinen varausaika."
    );

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:first-of-type")
      .click();

    startTimeSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();
    matchEvent();

    notificationContainer().should("not.exist");

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();

    notificationContainer().contains(
      "Varauksen puskuriajan vaatimukset eivät täyty. Valitse toinen varausaika."
    );

    startTimeSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(4)")
      .click();

    notificationContainer().contains(
      "Valittu aika on varattu. Valitse toinen aika."
    );

    startTimeSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:last-of-type")
      .click();

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:last-of-type")
      .click();

    notificationCloseButton().should("be.visible").click();

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:first-of-type")
      .click();
    matchEvent();

    reservationInfoPrice()
      .invoke("text")
      .then((text) => {
        expect(text).to.contain("80\u00a0€");
      });

    startTimeSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:first-of-type")
      .click();
    matchEvent();

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:nth-of-type(2)")
      .click();
    matchEvent();

    reservationInfoPrice()
      .invoke("text")
      .then((text) => {
        expect(text).to.contain("100\u00a0€");
      });

    durationSelectorToggle()
      .click()
      .siblings("ul")
      .children("li:last-of-type")
      .click();
    matchEvent();

    reservationInfoPrice()
      .invoke("text")
      .then((text) => {
        expect(text).to.contain("120\u00a0€");
      });

    cy.checkA11y(null, null, null, true);
  });
});

describe("Tilavaraus ui reservation unit page (single) preview", () => {
  Cypress.config("defaultCommandTimeout", 20000);

  it("should not display draft item", () => {
    cy.visit("/reservation-unit/single/999", { failOnStatusCode: false });

    error404Title().should("have.text", "404");
    error404Body().should("have.text", "Sivua ei löytynyt");
  });

  it("should display draft item if uuid matches", () => {
    cy.visit(
      "/reservation-unit/single/999?ru=8e5275aa-8625-4458-88b4-d5b1b2df6619"
    );

    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
  });
});

describe("Tilavaraus ui reservation unit page (single) with reservation times", () => {
  it("should display no calendar when off season", () => {
    cy.visit("/reservation-unit/single/900");

    gotoCalendarButton().should("not.exist");

    calendarWrapper().should("not.exist");

    reservationStartNotification().should("contain", "Varaaminen alkaa");
  });
});

describe("Tilavaraus ui reservation unit page (single) with reservation quota notification", () => {
  it("should display apt notification if quota is set and full", () => {
    cy.visit("/reservation-unit/single/901");

    gotoCalendarButton().should("not.exist");

    calendarWrapper().should("not.exist");

    reservationQuotaNotification()
      .invoke("text")
      .should(
        "match",
        /^Sinulla on jo \d+ varausta tähän tilaan. Et voi tehdä uusia varauksia.$/
      );
  });

  it("should display apt notification if quota is set but not full", () => {
    cy.visit("/reservation-unit/single/902");

    gotoCalendarButton().should("exist");

    calendarWrapper().should("exist");

    reservationQuotaNotification()
      .invoke("text")
      .should("match", /^Sinulla on jo \d+\/\d+ varausta tähän tilaan.$/);
  });
});
