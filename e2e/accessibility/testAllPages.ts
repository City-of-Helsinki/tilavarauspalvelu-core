import { axeCheck, createReport } from 'axe-testcafe';
import config from '../config';
import application from '../tests/model/application';
import home from '../tests/model/home';
import search from '../tests/model/search';

let violations;

const runAxeCheck = async (t) => {
  const check = await axeCheck(t);
  violations = check.violations;
};

fixture('axe').page(config.BASE_URL);

test('Front page', async (t) => {
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
});

test('Search page', async (t) => {
  await t.click(home.browseAllButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
  await t.typeText(search.searchText, 'Studio').click(search.searchButton);

  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
});

test('Reservation unit page', async (t) => {
  await t
    .click(home.browseAllButton)
    .click(search.searchButton)
    .click(search.reservationUnitPageLink);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
});

test('Application', async (t) => {
  // start filling application
  await t
    .click(home.browseAllButton)
    .typeText(search.searchText, 'Studio')
    .click(search.searchButton)
    .click(search.selectReservationUnitButton)
    .click(search.startApplicationButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
  // add application event
  await t.click(application.addApplicationEventButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
  // fill and submit page 1
  await t
    .click(application.page1.applicationEventAccordion)
    .typeText(application.page1.numPersonsInput, '12')
    .click(application.page1.ageGroupButton)
    .click(application.page1.ageGroupOption1)
    .click(application.page1.abilityGroupButton)
    .click(application.page1.abilityGroupOption1)
    .click(application.page1.purposeButton)
    .click(application.page1.purposeOption1)
    .click(application.page1.defaultPeriodCheckbox)
    .click(application.page1.nextButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
  // fill times
  await t.click(application.page2.applicationEventAccordion);
  await t
    .click(application.page2.randomApplicationEventScheduleButton())
    .click(application.page2.randomApplicationEventScheduleButton())
    .click(application.page2.randomApplicationEventScheduleButton())
    .click(application.page2.randomApplicationEventScheduleButton())
    .click(application.page2.randomApplicationEventScheduleButton());
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
  // next page
  await t.click(application.page2.nextButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));

  // select fill as individual
  await t.click(application.page3.fillAsIndividual);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));

  // fill contact info
  await t
    .typeText(application.page3.firstName, 'First')
    .typeText(application.page3.lastName, 'Last')
    .typeText(application.page3.streetAddress, 'Mannerheimintie 30')
    .typeText(application.page3.postCode, '00100')
    .typeText(application.page3.city, 'Helsinki')
    .typeText(application.page3.phoneNumber, '555-123456')
    .typeText(application.page3.email, 'first.last@example.com')
    .click(application.page3.nextButton);

  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));

  await t
    .click(application.preview.acceptTerms)
    .click(application.preview.sendButton);

  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
});
