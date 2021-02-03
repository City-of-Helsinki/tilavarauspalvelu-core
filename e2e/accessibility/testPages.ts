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
  await t
    .click(home.browseAllButton)
    .typeText(search.searchText, 'Studio')
    .click(search.searchButton)
    .click(search.selectReservationUnitButton)
    .click(search.startApplicationButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
  await t.click(application.addApplicationEventButton);
  await runAxeCheck(t);
  await t.expect(violations.length === 0).ok(createReport(violations));
});
