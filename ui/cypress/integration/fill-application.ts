import {
  firstAvailableApplicationRound,
  selectApplicationRoundButton,
  proceedToPage1Button,
  applicationName,
  numPersons,
  selectOption,
  acceptAndSaveEvent,
  nextButton,
  timeSelectorButton,
  fillAsIndividual,
  acceptTerms,
  submitApplication,
  selectPriority,
  timeSummary,
  resetButton,
  addNewApplicationButton,
  notificationTitle,
  applicationEventAccordion,
  copyCellsButton,
} from "../model/application";
import {
  addReservationUnitButton,
  clearSelectionsButton,
  startApplicationButton,
} from "../model/search";

describe("application", () => {
  beforeEach(() => {
    Cypress.config("defaultCommandTimeout", 20000);

    cy.fixture("v1/application_round").then((json) => {
      cy.intercept("GET", "/v1/application_round/*", json);
    });

    cy.fixture("v1/application_round_1").then((json) => {
      cy.intercept("GET", "/v1/application_round/1/*", json).as(
        "applicationRound1"
      );
    });

    cy.fixture("v1/application/post").then((json) => {
      cy.intercept("POST", "/v1/application/", json).as("applicationPost");
    });
    cy.fixture("v1/application/put_page_1").then((json) => {
      cy.intercept("PUT", "/v1/application/138", json);
    });

    cy.fixture("v1/application/138_page_1.json").then((json) => {
      cy.intercept("GET", "/v1/application/138/*", json).as("applicationPage1");
    });

    cy.fixture("v1/parameters/ability_group").then((json) => {
      cy.intercept("GET", "/v1/parameters/ability_group/*", json).as(
        "abilityGroup"
      );
    });

    cy.fixture("v1/parameters/age_group").then((json) => {
      cy.intercept("GET", "/v1/parameters/age_group/*", json).as("ageGroup");
    });

    cy.fixture("v1/parameters/city").then((json) => {
      cy.intercept("GET", "/v1/parameters/city/*", json).as("city");
    });

    cy.fixture("v1/parameters/purpose").then((json) => {
      cy.intercept("GET", "/v1/parameters/purpose/*", json).as("purpose");
    });

    cy.fixture("v1/reservation_unit/2").then((json) => {
      cy.intercept("GET", "/v1/reservation_unit/2/*", json);
    });

    cy.window().then((win) => {
      win.sessionStorage.clear();
      cy.visit("/search/?search=");
    });
  });

  it("can be submitted and is accessible", () => {
    startApplicationButton().should("not.exist");
    addReservationUnitButton(2).click();
    clearSelectionsButton().click();
    startApplicationButton().should("not.exist");
    addReservationUnitButton(2).click();
    startApplicationButton().should("exist");
    addReservationUnitButton(2).click();
    startApplicationButton().should("not.exist");
    addReservationUnitButton(2).click();
    startApplicationButton().click();

    cy.get("h1").should("contain", "Varaa tila koko kaudeksi");

    cy.a11yCheck();

    selectApplicationRoundButton().click();
    firstAvailableApplicationRound().click();
    proceedToPage1Button().click();

    cy.wait(
      [
        "@applicationPost",
        "@applicationPage1",
        "@applicationRound1",
        "@purpose",
        "@ageGroup",
        "@abilityGroup",
      ],
      { timeout: 20000 }
    );

    cy.get("h1").should("contain", "varauksen tiedot");

    cy.a11yCheck();

    applicationName(0).clear().type("Kurikan Vimma");
    numPersons(0).type("3");
    selectOption("applicationEvents[0].ageGroupId", 1);
    selectOption("applicationEvents[0].purposeId", 1);

    cy.intercept("PUT", "/v1/application/*").as("savePage1");
    acceptAndSaveEvent(0).click();

    cy.wait("@savePage1", { timeout: 20000 });

    addNewApplicationButton().click();
    applicationName(1).clear().type("Toca");
    numPersons(1).type("4");
    selectOption("applicationEvents[1].ageGroupId", 2);
    selectOption("applicationEvents[1].purposeId", 2);
    acceptAndSaveEvent(1).click();

    cy.fixture("v1/application/138_page_2").then((json) => {
      cy.intercept("GET", "/v1/application/138/*", json).as("page2");
    });

    nextButton().click();

    cy.wait(["@page2"]);

    cy.get("h1").should("contain", "ajankohta");

    cy.a11yCheck();

    timeSelectorButton(0, 7, 0).click();
    timeSelectorButton(0, 8, 0).click();
    timeSelectorButton(0, 9, 0).click();

    timeSummary(0, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantai:7-10TiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );

    selectPriority(0, 1);

    timeSelectorButton(0, 9, 0).click();
    timeSelectorButton(0, 8, 3).click();
    timeSelectorButton(0, 9, 3).click();

    timeSummary(0, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantai:7-9TiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );
    timeSummary(0, 1).should(
      "contain.text",
      "Muut aikatoiveetMaanantai:9-10TiistaiKeskiviikkoTorstai:8-10PerjantaiLauantaiSunnuntai"
    );

    resetButton(0).click();

    timeSummary(0, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );
    timeSummary(0, 1).should(
      "contain.text",
      "Muut aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );

    timeSelectorButton(0, 10, 1).click();

    cy.wait(100);

    timeSummary(0, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );
    timeSummary(0, 1).should(
      "contain.text",
      "Muut aikatoiveetMaanantaiTiistai:10-11KeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );

    nextButton().click();

    notificationTitle().should(
      "contain.text",
      "Lisää kaikille kausivarauksille vähintään yksi aika"
    );

    applicationEventAccordion(1).click();

    timeSummary(1, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );
    timeSummary(1, 1).should(
      "contain.text",
      "Muut aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );

    copyCellsButton(0).click();

    timeSummary(1, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );
    timeSummary(1, 1).should(
      "contain.text",
      "Muut aikatoiveetMaanantaiTiistai:10-11KeskiviikkoTorstaiPerjantaiLauantaiSunnuntai"
    );

    notificationTitle().should(
      "contain.text",
      "Ajat kopioitu onnistuneesti kaikille varaustoiveille"
    );

    nextButton().click();

    cy.get("h1").should("contain", "varaajan tiedot");

    cy.a11yCheck();

    fillAsIndividual();

    cy.fixture("v1/application/put_page_3").then((json) => {
      cy.intercept("PUT", "/v1/application/138", json);
      cy.intercept("GET", "/v1/application/138/*", json);
    });

    nextButton().click();

    cy.get("h1").should("contain", "lähetä hakemus");

    timeSummary(0, 0).should(
      "contain.text",
      "Ensisijaiset aikatoiveetMaanantaiTiistai:10-11KeskiviikkoTorstai:15-16PerjantaiLauantaiSunnuntai"
    );
    timeSummary(0, 1).should(
      "contain.text",
      "Muut aikatoiveetMaanantaiTiistaiKeskiviikkoTorstaiPerjantaiLauantai:17-18Sunnuntai"
    );

    acceptTerms();

    submitApplication();

    cy.get("h1").should("contain", "Kiitos hakemuksesta!");
  });
});
