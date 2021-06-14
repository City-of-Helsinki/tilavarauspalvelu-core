import {
  firstAvailableApplicationRound,
  selectApplicationRoundButton,
  proceedToPage1Button,
  applicationName,
  numPersons,
  selectOption,
  acceptAndSaveEvent,
  nextButton,
  randomApplicationEventScheduleButton,
  fillAsIndividual,
  acceptTerms,
  submitApplication,
} from 'model/application';
import {
  addReservationUnitButton,
  startApplicationButton,
} from '../model/search';

beforeEach(() => {
  cy.fixture('v1/application_round').then((json) => {
    cy.intercept('GET', '/v1/application_round/*', json);
  });

  cy.fixture('v1/application_round_1').then((json) => {
    cy.intercept('GET', '/v1/application_round/1/*', json).as(
      'applicationRound1'
    );
  });

  cy.fixture('v1/reservation_unit').then((json) => {
    cy.intercept('GET', '/v1/reservation_unit/*', json).as('reservationUnit');
  });

  cy.fixture('v1/application/post').then((json) => {
    cy.intercept('POST', '/v1/application/', json).as('applicationPost');
  });
  cy.fixture('v1/application/put_page_1').then((json) => {
    cy.intercept('PUT', '/v1/application/138', json);
  });

  cy.fixture('v1/application/138_page_1.json').then((json) => {
    cy.intercept('GET', '/v1/application/138/*', json).as('applicationPage1');
  });

  cy.fixture('v1/parameters/reservation_unit_type').then((json) => {
    cy.intercept('GET', '/v1/parameters/reservation_unit_type/*', json).as(
      'reservationUnitType'
    );
  });

  cy.fixture('v1/parameters/ability_group').then((json) => {
    cy.intercept('GET', '/v1/parameters/ability_group/*', json).as(
      'abilityGroup'
    );
  });

  cy.fixture('v1/parameters/age_group').then((json) => {
    cy.intercept('GET', '/v1/parameters/age_group/*', json).as('ageGroup');
  });

  cy.fixture('v1/parameters/city').then((json) => {
    cy.intercept('GET', '/v1/parameters/city/*', json).as('city');
  });

  cy.fixture('v1/parameters/purpose').then((json) => {
    cy.intercept('GET', '/v1/parameters/purpose/*', json).as('purpose');
  });

  cy.fixture('v1/reservation_unit/2').then((json) => {
    cy.intercept('GET', '/v1/reservation_unit/2/*', json);
  });

  cy.visit('/search/?search=');
});

describe('application', () => {
  it('can be submitted and is accessible', () => {
    cy.wait('@reservationUnit');
    addReservationUnitButton('Studiokompleksi').click();
    startApplicationButton().click();

    cy.a11yCheck();

    selectApplicationRoundButton().click();
    firstAvailableApplicationRound().click();
    proceedToPage1Button().click();
    cy.wait([
      '@applicationPost',
      '@applicationPage1',
      '@applicationRound1',
      '@purpose',
      '@ageGroup',
      '@abilityGroup',
      '@reservationUnitType',
    ]);

    cy.a11yCheck();

    applicationName().clear().type('Kurikan Vimma');
    numPersons().type('3');
    selectOption('applicationEvents[0].ageGroupId', 1);
    selectOption('applicationEvents[0].purposeId', 1);
    acceptAndSaveEvent().click();
    nextButton().click();

    cy.a11yCheck();


    randomApplicationEventScheduleButton().click();
    randomApplicationEventScheduleButton().click();
    randomApplicationEventScheduleButton().click();

    nextButton().click();

    cy.a11yCheck();

    fillAsIndividual();
    cy.wait(['@city']);

    cy.fixture('v1/application/put_page_3').then((json) => {
      cy.intercept('PUT', '/v1/application/138', json);
    });

    nextButton().click();

    cy.a11yCheck();

    acceptTerms();

    submitApplication();

    cy.get('h1').should('contain', 'Hakemuksesi on');
  });

});
